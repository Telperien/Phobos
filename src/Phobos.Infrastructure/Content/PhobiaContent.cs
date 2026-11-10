using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;
using Phobos.Application;
using Phobos.Domain;

namespace Phobos.Infrastructure.Content;

/// <summary>A content file: its name (<c>arachnophobia.json</c>) and its JSON text.</summary>
public sealed record ContentFile(string Name, string Json);

/// <summary>
/// Reads the case files of <c>content/phobias/</c>, one JSON file per phobia, embedded in this assembly.
/// Any mistake stops the loading with a message naming the file: the API refuses to start on broken content.
/// </summary>
public static partial class PhobiaContent
{
    private const string ResourcePrefix = "content/phobias/";

    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        RespectNullableAnnotations = true,
        RespectRequiredConstructorParameters = true,
    };

    public static Phobia Parse(string json)
    {
        var entry = JsonSerializer.Deserialize<Entry>(json, Options) ?? throw new InvalidDataException("The file is empty.");
        if (!CategoryCodes.TryParse(entry.Category, out var category))
            throw new InvalidDataException($"{entry.Slug}: unknown category '{entry.Category}'.");

        var phobia = Phobia.Create(entry.Slug, entry.CaseNumber, category,
            entry.Translations.Select(pair => ToTranslation(entry.Slug, pair.Key, pair.Value)));
        AddMedia(phobia, entry);
        if (entry.Published ?? true) phobia.Publish();
        return phobia;
    }

    /// <returns>The case files in case number order.</returns>
    public static IReadOnlyList<Phobia> Load(IEnumerable<ContentFile> files)
    {
        var phobias = new List<Phobia>();
        foreach (var file in files)
        {
            var phobia = ParseFile(file);
            if (file.Name != $"{phobia.Slug}.json")
                throw new InvalidDataException($"{file.Name} holds '{phobia.Slug}': name it {phobia.Slug}.json.");
            if (phobias.Find(other => other.CaseNumber == phobia.CaseNumber) is { } twin)
                throw new InvalidDataException($"{phobia.Slug} and {twin.Slug} share case number {phobia.CaseNumber}.");
            phobias.Add(phobia);
        }
        return phobias.OrderBy(phobia => phobia.CaseNumber).ToList();
    }

    public static IReadOnlyList<Phobia> LoadShipped()
    {
        var assembly = typeof(PhobiaContent).Assembly;
        return Load(assembly.GetManifestResourceNames()
            .Where(name => name.StartsWith(ResourcePrefix, StringComparison.Ordinal))
            .Select(name => new ContentFile(name[ResourcePrefix.Length..], ReadResource(assembly, name))));
    }

    private static Phobia ParseFile(ContentFile file)
    {
        try
        {
            return Parse(file.Json);
        }
        catch (Exception error) when (error is JsonException or DomainRuleException or InvalidDataException)
        {
            throw new InvalidDataException($"{file.Name}: {error.Message}", error);
        }
    }

    private static string ReadResource(Assembly assembly, string name)
    {
        using var reader = new StreamReader(assembly.GetManifestResourceStream(name)!);
        return reader.ReadToEnd();
    }

    private static void AddMedia(Phobia phobia, Entry entry)
    {
        foreach (var image in entry.Images ?? []) phobia.AddMedia(ToImage(entry.Slug, image));
        if (entry.Video is { } video) phobia.AddMedia(ExposureMedia.YouTube(video.YouTube, video.Start));
    }

    private static PhobiaTranslation ToTranslation(string slug, string code, Text text)
    {
        if (!Languages.TryParse(code, out var language))
            throw new InvalidDataException($"{slug}: unknown language '{code}'.");
        return new PhobiaTranslation(language, text.Name, text.Etymology, text.Summary, text.Description, text.Annotation);
    }

    private static ExposureMedia ToImage(string slug, ImageEntry image)
    {
        var name = image.File.StartsWith(slug + "/", StringComparison.Ordinal) ? image.File[(slug.Length + 1)..] : "";
        if (!WebpName().IsMatch(name))
            throw new InvalidDataException($"{slug}: image '{image.File}' must be {slug}/<name>.webp.");
        return ExposureMedia.Image(image.Level, image.File, ToCredit(slug, image));
    }

    private static ImageCredit ToCredit(string slug, ImageEntry image) => image.Origin switch
    {
        "ai" => ImageCredit.Generated,
        "web" => ImageCredit.Licensed(image.License ?? "", ToSource(slug, image), image.Author),
        _ => throw new InvalidDataException($"{slug}: image origin '{image.Origin}' is neither 'ai' nor 'web'."),
    };

    private static Uri ToSource(string slug, ImageEntry image) =>
        Uri.TryCreate(image.Url, UriKind.Absolute, out var source)
            ? source
            : throw new InvalidDataException($"{slug}: image '{image.File}' found on the web needs the address it comes from.");

    [GeneratedRegex(@"^[a-z0-9][a-z0-9_-]*\.webp$")]
    private static partial Regex WebpName();

    private sealed record Entry(
        string Slug,
        int CaseNumber,
        string Category,
        Dictionary<string, Text> Translations,
        List<ImageEntry>? Images = null,
        VideoEntry? Video = null,
        bool? Published = null);

    private sealed record Text(string Name, string Etymology, string Summary, string Description, string Annotation);

    private sealed record ImageEntry(
        int Level, string File, string Origin, string? Author = null, string? License = null, string? Url = null);

    private sealed record VideoEntry(string YouTube, int Start = 0);
}

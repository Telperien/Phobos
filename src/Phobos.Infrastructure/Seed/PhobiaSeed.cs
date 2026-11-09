using System.Text.Json;
using Phobos.Application;
using Phobos.Domain;

namespace Phobos.Infrastructure.Seed;

/// <summary>Reads the starting catalogue from <c>phobias.json</c>. Every seeded phobia is published.</summary>
public static class PhobiaSeed
{
    private const string ShippedResource = "Phobos.Infrastructure.Seed.phobias.json";

    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static IReadOnlyList<Phobia> LoadShipped()
    {
        using var stream = typeof(PhobiaSeed).Assembly.GetManifestResourceStream(ShippedResource)
            ?? throw new InvalidOperationException($"Embedded resource {ShippedResource} is missing.");
        using var reader = new StreamReader(stream);
        return Parse(reader.ReadToEnd());
    }

    public static IReadOnlyList<Phobia> Parse(string json)
    {
        var entries = JsonSerializer.Deserialize<List<SeedEntry>>(json, Options)
            ?? throw new InvalidDataException("The seed file is empty.");
        return entries.Select(ToPhobia).ToList();
    }

    private static Phobia ToPhobia(SeedEntry entry)
    {
        if (!CategoryCodes.TryParse(entry.Category, out var category))
            throw new InvalidDataException($"{entry.Slug}: unknown category '{entry.Category}'.");

        var phobia = Phobia.Create(entry.Slug, entry.CaseNumber, category,
            entry.Translations.Select(pair => ToTranslation(entry.Slug, pair.Key, pair.Value)));
        phobia.Publish();
        return phobia;
    }

    private static PhobiaTranslation ToTranslation(string slug, string code, SeedText text)
    {
        if (!Languages.TryParse(code, out var language))
            throw new InvalidDataException($"{slug}: unknown language '{code}'.");
        return new PhobiaTranslation(language, text.Name, text.Etymology, text.Summary, text.Description, text.Annotation);
    }

    private sealed record SeedEntry(string Slug, int CaseNumber, string Category, Dictionary<string, SeedText> Translations);

    private sealed record SeedText(string Name, string Etymology, string Summary, string Description, string Annotation);
}

using Phobos.Domain;

namespace Phobos.Application;

/// <summary>Read side of the catalogue: list, case file, random draw. Only published phobias are visible.</summary>
public sealed class PhobiaQueries(IPhobiaCatalogue catalogue, IRandomIndex random)
{
    private static readonly int[] LevelNumbers = [1, 2, 3];

    public async Task<IReadOnlyList<PhobiaSummary>> ListAsync(
        Language language, Category? category, CancellationToken cancellationToken)
    {
        var published = await ListPublishedAsync(cancellationToken);
        return published
            .Where(phobia => category is null || phobia.Category == category)
            .Select(phobia => Summarize(phobia, language))
            .ToList();
    }

    public async Task<PhobiaDetail?> GetAsync(Language language, string slug, CancellationToken cancellationToken)
    {
        var phobia = await catalogue.FindBySlugAsync(slug, cancellationToken);
        return phobia is { IsPublished: true } ? Detail(phobia, language) : null;
    }

    public async Task<PhobiaDetail?> DrawAsync(
        Language language, IReadOnlyCollection<string> seen, CancellationToken cancellationToken)
    {
        var published = await ListPublishedAsync(cancellationToken);
        var drawn = RouletteDraw.Pick(published, seen, phobia => phobia.Slug, random.IndexBelow);
        return drawn is null ? null : Detail(drawn, language);
    }

    private async Task<List<Phobia>> ListPublishedAsync(CancellationToken cancellationToken)
    {
        var all = await catalogue.ListAsync(cancellationToken);
        return all.Where(phobia => phobia.IsPublished).OrderBy(phobia => phobia.CaseNumber).ToList();
    }

    private static PhobiaSummary Summarize(Phobia phobia, Language language)
    {
        var text = phobia.TranslationFor(language);
        return new PhobiaSummary(
            phobia.Slug, phobia.CaseNumber, CategoryCodes.Code(phobia.Category), Languages.Code(text.Language),
            text.Name, text.Etymology, text.Summary);
    }

    private static PhobiaDetail Detail(Phobia phobia, Language language)
    {
        var text = phobia.TranslationFor(language);
        var levels = LevelNumbers
            .Select(number => new ExposureLevelView(number, phobia.MediaForLevel(number).Select(View).ToList()))
            .ToList();
        return new PhobiaDetail(
            phobia.Slug, phobia.CaseNumber, CategoryCodes.Code(phobia.Category), Languages.Code(text.Language),
            text.Name, text.Etymology, text.Summary, text.Description, text.Annotation, levels);
    }

    private static MediaView View(ExposureMedia media) => media.Kind switch
    {
        MediaKind.Image => new MediaView("image", $"/media/{media.Source}", 0),
        _ => new MediaView("youtube", media.Source, media.StartSeconds),
    };
}

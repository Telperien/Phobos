namespace Phobos.Application;

public sealed record PhobiaSummary(
    string Slug, int CaseNumber, string Category, string Language, string Name, string Etymology, string Summary);

public sealed record PhobiaDetail(
    string Slug,
    int CaseNumber,
    string Category,
    string Language,
    string Name,
    string Etymology,
    string Summary,
    string Description,
    string Annotation,
    IReadOnlyList<ExposureLevelView> Levels);

public sealed record ExposureLevelView(int Number, IReadOnlyList<MediaView> Media);

/// <param name="Source">Image URL, or YouTube video id.</param>
/// <param name="Credit">Who to credit for an image found on the web; null for generated images and videos.</param>
public sealed record MediaView(string Kind, string Source, int StartSeconds, MediaCredit? Credit = null);

/// <param name="Author">Null when unknown (public domain, for instance).</param>
public sealed record MediaCredit(string? Author, string License, string SourceUrl);

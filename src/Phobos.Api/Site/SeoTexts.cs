namespace Phobos.Api.Site;

/// <summary>Page texts of one language, read from <c>seo.json</c> (written by the front-end build).</summary>
public sealed record SeoTexts(
    string Locale,
    string Title,
    string Description,
    IReadOnlyDictionary<string, string> Pages,
    IReadOnlyDictionary<string, string> Verdicts);

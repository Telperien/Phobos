namespace Phobos.Api.Site;

/// <summary>
/// Addresses of the site in the words of each language (<c>/en/case-files</c>), from the routes of the front end
/// (<c>/en/dossiers</c>). The words come from seo.json, written from the interface messages.
/// </summary>
public static class SitePaths
{
    public const string CaseFiles = "dossiers";
    public const string Roulette = "roulette";
    public const string PersonalFile = "mon-dossier";

    /// <summary>Route segments of an address after its language, whatever language its words are in.</summary>
    public static string[] Route(IEnumerable<string> segments, IReadOnlyDictionary<string, SeoTexts> texts) =>
        [.. segments.Select((segment, index) => index == 0 ? SectionOf(segment, texts) ?? segment : segment)];

    /// <summary>Address of a route in a language: ("en", "/dossiers/x") gives "/en/case-files/x".</summary>
    public static string Public(string lang, string route, IReadOnlyDictionary<string, SeoTexts> texts)
    {
        var segments = route.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length > 0) segments[0] = texts[lang].Paths.GetValueOrDefault(segments[0], segments[0]);
        return "/" + string.Join('/', [lang, .. segments]);
    }

    /// <summary>The address in the words of its own language; any other address is returned as it is.</summary>
    public static string Canonical(string path, IReadOnlyDictionary<string, SeoTexts> texts)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length == 0 || !texts.ContainsKey(segments[0])) return path;
        return Public(segments[0], "/" + string.Join('/', Route(segments[1..], texts)), texts);
    }

    private static string? SectionOf(string word, IReadOnlyDictionary<string, SeoTexts> texts) =>
        texts.Values.SelectMany(t => t.Paths).FirstOrDefault(pair => pair.Value == word).Key;
}

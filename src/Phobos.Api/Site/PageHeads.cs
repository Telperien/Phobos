using Phobos.Application;
using Phobos.Domain;

namespace Phobos.Api.Site;

/// <param name="StatusCode">404 for a case file that does not exist: the site still shows its own message.</param>
public sealed record PageResult(PageHead Head, int StatusCode);

/// <summary>Decides the head of each address of the site: home, sections, case files (and a shared verdict).</summary>
public sealed class PageHeads(PhobiaQueries queries)
{
    /// <returns>Null for an address that is not a page of a known language: the default head stays.</returns>
    public async Task<PageResult?> ForAsync(
        string path, string? verdict, IReadOnlyDictionary<string, SeoTexts> texts, Uri baseUrl,
        CancellationToken cancellationToken)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length == 0 || !texts.TryGetValue(segments[0], out var t)) return null;

        var lang = segments[0];
        var site = new PageHead(lang, t.Title, t.Description, "", new Uri(HeadHtml.Absolute(baseUrl, "/og.jpg")), true);
        return SitePaths.Route(segments[1..], texts) switch
        {
            [] => new PageResult(site, StatusCodes.Status200OK),
            [var page] when t.Pages.TryGetValue(page, out var name) => new PageResult(
                site with { Title = $"{name} — Phobos", Route = $"/{page}", Indexable = page is not (SitePaths.PersonalFile or SitePaths.LegalNotice) },
                StatusCodes.Status200OK),
            [SitePaths.CaseFiles, var slug] => await CaseFileAsync(
                site, slug, t.Verdicts.GetValueOrDefault(verdict ?? ""), baseUrl, cancellationToken),
            _ => null,
        };
    }

    private async Task<PageResult> CaseFileAsync(
        PageHead site, string slug, string? verdict, Uri baseUrl, CancellationToken cancellationToken)
    {
        var page = site with { Route = $"/{SitePaths.CaseFiles}/{slug}" };
        _ = Languages.TryParse(site.Lang, out var language);
        var detail = await queries.GetAsync(language, slug, cancellationToken);
        if (detail is null) return new PageResult(page with { Indexable = false }, StatusCodes.Status404NotFound);

        var image = detail.Levels[0].Media.FirstOrDefault(media => media.Kind == "image")?.Source;
        return new PageResult(
            page with
            {
                Title = $"{detail.Name} — {verdict ?? "Phobos"}",
                Description = $"{detail.Summary} {detail.Description}",
                Image = image is null ? site.Image : new Uri(HeadHtml.Absolute(baseUrl, image)),
            },
            StatusCodes.Status200OK);
    }
}

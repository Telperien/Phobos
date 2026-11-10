using System.Text.Json;
using System.Xml.Linq;
using Microsoft.Extensions.FileProviders;
using Phobos.Application;
using Phobos.Domain;

namespace Phobos.Api.Site;

/// <summary>
/// Serves the built React site with a head written for each page, plus sitemap.xml and robots.txt.
/// Without the build files (index.html with its head markers, seo.json) pages are served as they are.
/// </summary>
public static class SiteEndpoints
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);
    private static readonly XNamespace Sitemap = "http://www.sitemaps.org/schemas/sitemap/0.9";
    private static readonly XNamespace Xhtml = "http://www.w3.org/1999/xhtml";

    public static void MapSite(this WebApplication app)
    {
        app.MapGet("/sitemap.xml", SitemapAsync).ExcludeFromDescription();
        app.MapGet("/robots.txt", Robots).ExcludeFromDescription();
        app.MapFallback(PageAsync);
    }

    private static Uri BaseUrl(HttpContext context, IConfiguration configuration) =>
        new(configuration["Site:PublicUrl"] ?? $"{context.Request.Scheme}://{context.Request.Host}/");

    private static async Task<string?> ReadAsync(IFileProvider files, string name)
    {
        var file = files.GetFileInfo(name);
        if (!file.Exists) return null;
        await using var stream = file.CreateReadStream();
        using var reader = new StreamReader(stream);
        return await reader.ReadToEndAsync();
    }

    /// <summary>Texts and address words of every language, written by the front-end build; null without it.</summary>
    private static async Task<Dictionary<string, SeoTexts>?> ReadTextsAsync(IWebHostEnvironment environment)
    {
        var json = await ReadAsync(environment.WebRootFileProvider, "seo.json");
        return json is null ? null : JsonSerializer.Deserialize<Dictionary<string, SeoTexts>>(json, Options);
    }

    private static async Task<IResult> PageAsync(
        HttpContext context, IWebHostEnvironment environment, IConfiguration configuration, PageHeads heads,
        CancellationToken cancellationToken)
    {
        var page = await ReadAsync(environment.WebRootFileProvider, "index.html");
        if (page is null) return Results.NotFound();
        context.Response.Headers.CacheControl = SiteCaching.Page;

        var texts = await ReadTextsAsync(environment);
        if (texts is null) return Results.Content(page, "text/html; charset=utf-8");

        // An address in other words (an old link, another language's word) moves for good to its own words.
        var path = context.Request.Path.Value ?? "/";
        var canonical = SitePaths.Canonical(path, texts);
        if (canonical != path) return Results.Redirect(new PathString(canonical).Add(context.Request.QueryString), permanent: true);

        var baseUrl = BaseUrl(context, configuration);
        var result = await heads.ForAsync(path, context.Request.Query["verdict"], texts, baseUrl, cancellationToken);
        if (result is null) return Results.Content(page, "text/html; charset=utf-8");

        var head = HeadHtml.Render(result.Head, texts, baseUrl);
        return Results.Content(
            HeadHtml.Inject(page, head, result.Head.Lang), "text/html; charset=utf-8", statusCode: result.StatusCode);
    }

    private static async Task<IResult> SitemapAsync(
        HttpContext context, IWebHostEnvironment environment, IConfiguration configuration, PhobiaQueries queries,
        CancellationToken cancellationToken)
    {
        var texts = await ReadTextsAsync(environment);
        if (texts is null) return Results.NotFound();
        var baseUrl = BaseUrl(context, configuration);
        var phobias = await queries.ListAsync(Language.En, category: null, cancellationToken);
        const string caseFiles = "/" + SitePaths.CaseFiles;
        string[] routes = ["", caseFiles, "/" + SitePaths.Roulette, .. phobias.Select(phobia => $"{caseFiles}/{phobia.Slug}")];
        string Url(string code, string route) => HeadHtml.Absolute(baseUrl, SitePaths.Public(code, route, texts));

        var urls = texts.Keys.SelectMany(code => routes.Select(route => new XElement(Sitemap + "url",
            new XElement(Sitemap + "loc", Url(code, route)),
            texts.Keys.Select(other => new XElement(Xhtml + "link",
                new XAttribute("rel", "alternate"),
                new XAttribute("hreflang", other),
                new XAttribute("href", Url(other, route)))))));
        var sitemap = new XElement(Sitemap + "urlset", new XAttribute(XNamespace.Xmlns + "xhtml", Xhtml), urls);
        return Results.Content("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + sitemap, "application/xml");
    }

    private static IResult Robots(HttpContext context, IConfiguration configuration) =>
        Results.Text(
            "User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: "
            + HeadHtml.Absolute(BaseUrl(context, configuration), "/sitemap.xml") + "\n",
            "text/plain");
}

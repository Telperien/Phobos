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

    private static async Task<IResult> PageAsync(
        HttpContext context, IWebHostEnvironment environment, IConfiguration configuration, PageHeads heads,
        CancellationToken cancellationToken)
    {
        var page = await ReadAsync(environment.WebRootFileProvider, "index.html");
        if (page is null) return Results.NotFound();
        context.Response.Headers.CacheControl = SiteCaching.Page;

        var json = await ReadAsync(environment.WebRootFileProvider, "seo.json");
        var texts = json is null ? null : JsonSerializer.Deserialize<Dictionary<string, SeoTexts>>(json, Options);
        var baseUrl = BaseUrl(context, configuration);
        var result = texts is null
            ? null
            : await heads.ForAsync(context.Request.Path, context.Request.Query["verdict"], texts, baseUrl, cancellationToken);
        if (texts is null || result is null) return Results.Content(page, "text/html; charset=utf-8");

        var head = HeadHtml.Render(result.Head, texts[result.Head.Lang].Locale, baseUrl, [.. texts.Keys]);
        return Results.Content(
            HeadHtml.Inject(page, head, result.Head.Lang), "text/html; charset=utf-8", statusCode: result.StatusCode);
    }

    private static async Task<IResult> SitemapAsync(
        HttpContext context, IConfiguration configuration, PhobiaQueries queries, CancellationToken cancellationToken)
    {
        var baseUrl = BaseUrl(context, configuration);
        var phobias = await queries.ListAsync(Language.En, category: null, cancellationToken);
        string[] rests = ["", "/dossiers", "/roulette", .. phobias.Select(phobia => $"/dossiers/{phobia.Slug}")];
        var codes = Languages.All.Select(Languages.Code).ToList();

        var urls = codes.SelectMany(code => rests.Select(rest => new XElement(Sitemap + "url",
            new XElement(Sitemap + "loc", HeadHtml.Absolute(baseUrl, $"/{code}{rest}")),
            codes.Select(other => new XElement(Xhtml + "link",
                new XAttribute("rel", "alternate"),
                new XAttribute("hreflang", other),
                new XAttribute("href", HeadHtml.Absolute(baseUrl, $"/{other}{rest}")))))));
        var sitemap = new XElement(Sitemap + "urlset", new XAttribute(XNamespace.Xmlns + "xhtml", Xhtml), urls);
        return Results.Content("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + sitemap, "application/xml");
    }

    private static IResult Robots(HttpContext context, IConfiguration configuration) =>
        Results.Text(
            "User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: "
            + HeadHtml.Absolute(BaseUrl(context, configuration), "/sitemap.xml") + "\n",
            "text/plain");
}

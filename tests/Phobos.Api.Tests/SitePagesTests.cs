using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Phobos.Api.Site;
using Phobos.Application;
using Phobos.Domain;
using Phobos.Infrastructure.Content;

namespace Phobos.Api.Tests;

/// <summary>
/// Each page of the built site gets its own head (title, description, language versions, link preview),
/// written by the API from seo.json (texts emitted by the front-end build) and the case files.
/// </summary>
public sealed partial class SitePagesTests : IClassFixture<PhobosApiFactory>, IDisposable
{
    private const string EntryPage = """
        <!doctype html>
        <html lang="fr">
          <head>
            <meta charset="UTF-8" />
            <!-- head:start (replaced per page) -->
            <title>Default title</title>
            <!-- head:end -->
          </head>
          <body><div id="root"></div></body>
        </html>
        """;

    private static readonly string[] Codes = ["fr", "en", "es", "de", "it"];

    /// <summary>Words of the catalogue, roulette and personal file sections in the addresses of each language.</summary>
    private static readonly Dictionary<string, string[]> Words = new()
    {
        ["fr"] = ["dossiers", "roulette", "mon-dossier"],
        ["en"] = ["case-files", "roulette", "my-file"],
        ["es"] = ["expedientes", "ruleta", "mi-expediente"],
        ["de"] = ["akten", "roulette", "meine-akte"],
        ["it"] = ["fascicoli", "roulette", "il-mio-fascicolo"],
    };

    private readonly string _webRoot = Path.Combine(Path.GetTempPath(), "phobos-seo-" + Guid.NewGuid().ToString("N"));
    private readonly PhobosApiFactory _factory;
    private readonly HttpClient _client;

    public SitePagesTests(PhobosApiFactory factory)
    {
        Directory.CreateDirectory(_webRoot);
        File.WriteAllText(Path.Combine(_webRoot, "index.html"), EntryPage);
        File.WriteAllText(Path.Combine(_webRoot, "seo.json"), JsonSerializer.Serialize(
            Codes.ToDictionary(code => code, code => new
            {
                locale = $"{code}_XX",
                title = $"Phobos — Title {code}",
                description = $"Description {code}",
                pages = new Dictionary<string, string>
                {
                    ["dossiers"] = $"Files {code}",
                    ["roulette"] = $"Roulette {code}",
                    ["mon-dossier"] = $"My file {code}",
                },
                verdicts = new Dictionary<string, string>
                {
                    ["veryPhobic"] = $"Very phobic {code}",
                    ["phobic"] = $"Phobic {code}",
                    ["sensitive"] = $"Sensitive {code}",
                    ["notPhobic"] = $"Not phobic {code}",
                },
                paths = new Dictionary<string, string>
                {
                    ["dossiers"] = Words[code][0],
                    ["roulette"] = Words[code][1],
                    ["mon-dossier"] = Words[code][2],
                },
            })));
        _factory = factory;
        _client = ClientWith();
    }

    public void Dispose()
    {
        _client.Dispose();
        Directory.Delete(_webRoot, recursive: true);
    }

    private HttpClient ClientWith(string? publicUrl = null) =>
        _factory.WithWebHostBuilder(builder =>
        {
            builder.UseWebRoot(_webRoot);
            if (publicUrl is not null) builder.UseSetting("Site:PublicUrl", publicUrl);
        }).CreateClient();

    private async Task<(HttpStatusCode Status, string Html)> PageAsync(string url, HttpClient? client = null)
    {
        using var response = await (client ?? _client).GetAsync(new Uri(url, UriKind.Relative));
        return (response.StatusCode, await response.Content.ReadAsStringAsync());
    }

    private static string? Meta(string html, string property) =>
        Regex.Match(html, $"""<meta (?:property|name)="{Regex.Escape(property)}" content="([^"]*)" />""") is { Success: true } match
            ? WebUtility.HtmlDecode(match.Groups[1].Value)
            : null;

    private static string? Title(string html) => TitleTag().Match(html) is { Success: true } match ? WebUtility.HtmlDecode(match.Groups[1].Value) : null;

    [GeneratedRegex("<title>([^<]*)</title>")]
    private static partial Regex TitleTag();

    [Fact]
    public async Task A_case_file_page_gets_its_own_head_in_its_language()
    {
        var (status, html) = await PageAsync("/en/case-files/arachnophobia");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Contains("""<html lang="en">""", html, StringComparison.Ordinal);
        Assert.Equal("Arachnophobia — Phobos", Title(html));
        Assert.Equal("Arachnophobia — Phobos", Meta(html, "og:title"));
        Assert.StartsWith("Fear of spiders.", Meta(html, "description"), StringComparison.Ordinal);
        Assert.Equal("http://localhost/media/arachnophobia/1-a.webp", Meta(html, "og:image"));
        Assert.Equal("en_XX", Meta(html, "og:locale"));
        Assert.Equal("website", Meta(html, "og:type"));
        Assert.Equal("Phobos", Meta(html, "og:site_name"));
        Assert.StartsWith("Fear of spiders.", Meta(html, "og:description"), StringComparison.Ordinal);
        Assert.Equal("http://localhost/en/case-files/arachnophobia", Meta(html, "og:url"));
        Assert.Equal("summary_large_image", Meta(html, "twitter:card"));
        Assert.DoesNotContain("head:end", html, StringComparison.Ordinal);
        Assert.Contains("""<link rel="canonical" href="http://localhost/en/case-files/arachnophobia" />""", html, StringComparison.Ordinal);
        Assert.Contains("""<link rel="alternate" hreflang="fr" href="http://localhost/fr/dossiers/arachnophobia" />""", html, StringComparison.Ordinal);
        Assert.Contains("""<link rel="alternate" hreflang="de" href="http://localhost/de/akten/arachnophobia" />""", html, StringComparison.Ordinal);
        Assert.Contains("""<link rel="alternate" hreflang="x-default" href="http://localhost/en/case-files/arachnophobia" />""", html, StringComparison.Ordinal);
        Assert.DoesNotContain("Default title", html, StringComparison.Ordinal);
        Assert.Contains("""<div id="root"></div>""", html, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_shared_verdict_shows_in_the_link_preview()
    {
        var (_, html) = await PageAsync("/fr/dossiers/arachnophobia?verdict=sensitive");

        Assert.Equal("Arachnophobie — Sensitive fr", Meta(html, "og:title"));
        Assert.Contains("""<link rel="canonical" href="http://localhost/fr/dossiers/arachnophobia" />""", html, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_case_file_without_images_shows_the_site_preview_image()
    {
        // A case file of its own: the shipped ones all have images now.
        var heights = Phobia.Create("acrophobia", 14, Category.NatureAndSpaces,
            [new PhobiaTranslation(Language.Fr, "Acrophobie", "du grec", "Peur du vide.", "Description.", "Note.")]);
        heights.Publish();
        using var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseWebRoot(_webRoot);
            builder.ConfigureTestServices(services =>
                services.AddSingleton<IPhobiaCatalogue>(new ContentPhobiaCatalogue([heights])));
        }).CreateClient();

        var (_, html) = await PageAsync("/fr/dossiers/acrophobia", client);

        Assert.Equal("http://localhost/og.jpg", Meta(html, "og:image"));
    }

    [Fact]
    public async Task An_unknown_verdict_is_ignored()
    {
        var (_, html) = await PageAsync("/fr/dossiers/arachnophobia?verdict=brave");

        Assert.Equal("Arachnophobie — Phobos", Meta(html, "og:title"));
    }

    [Theory]
    [InlineData("/de", "Phobos — Title de", "http://localhost/og.jpg")]
    [InlineData("/de/akten", "Files de — Phobos", "http://localhost/og.jpg")]
    [InlineData("/it/roulette", "Roulette it — Phobos", "http://localhost/og.jpg")]
    [InlineData("/es/ruleta", "Roulette es — Phobos", "http://localhost/og.jpg")]
    public async Task Section_pages_are_named_in_their_language(string url, string title, string image)
    {
        var (status, html) = await PageAsync(url);

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(title, Title(html));
        Assert.Equal(image, Meta(html, "og:image"));
        Assert.Null(Meta(html, "robots"));
    }

    [Fact]
    public async Task The_personal_file_page_is_kept_out_of_search_engines()
    {
        var (_, html) = await PageAsync("/es/mi-expediente");

        Assert.Equal("My file es — Phobos", Title(html));
        Assert.Equal("noindex", Meta(html, "robots"));
    }

    [Fact]
    public async Task An_unknown_case_file_answers_404_with_the_site_so_it_can_say_so()
    {
        var (status, html) = await PageAsync("/fr/dossiers/unknown-fear");

        Assert.Equal(HttpStatusCode.NotFound, status);
        Assert.Contains("""<div id="root"></div>""", html, StringComparison.Ordinal);
        Assert.Equal("noindex", Meta(html, "robots"));
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/fr/nowhere/at-all")]
    public async Task Other_addresses_keep_the_default_head(string url)
    {
        var (status, html) = await PageAsync(url);

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal("Default title", Title(html));
    }

    [Fact]
    public async Task A_page_without_head_markers_is_served_as_it_is()
    {
        const string page = "<!doctype html><html lang=\"fr\"><title>No markers</title></html>";
        File.WriteAllText(Path.Combine(_webRoot, "index.html"), page);

        var (_, html) = await PageAsync("/en/dossiers");

        Assert.Equal(page, html);
    }

    [Fact]
    public async Task Behind_the_hosting_proxy_links_keep_the_https_address_the_visitor_used()
    {
        // The App Service front end reaches the app from an internal address, not from loopback.
        using var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseWebRoot(_webRoot);
            builder.ConfigureTestServices(services => services.AddTransient<IStartupFilter, FromInternalNetwork>());
        }).CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, new Uri("/it/roulette", UriKind.Relative));
        request.Headers.Add("X-Forwarded-Proto", "https");

        using var response = await client.SendAsync(request);
        var html = await response.Content.ReadAsStringAsync();

        Assert.Contains("""<link rel="canonical" href="https://localhost/it/roulette" />""", html, StringComparison.Ordinal);
    }

    [Fact]
    public async Task The_configured_public_address_is_used_for_absolute_links()
    {
        using var client = ClientWith("https://phobos.example/");

        var (_, html) = await PageAsync("/it/fascicoli", client);

        Assert.Contains("""<link rel="canonical" href="https://phobos.example/it/fascicoli" />""", html, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("/en/dossiers/arachnophobia?verdict=sensitive", "/en/case-files/arachnophobia?verdict=sensitive")]
    [InlineData("/de/case-files", "/de/akten")]
    [InlineData("/it/mon-dossier", "/it/il-mio-fascicolo")]
    [InlineData("/es/roulette/", "/es/ruleta")]
    public async Task An_address_in_other_words_moves_for_good_to_the_words_of_its_language(string url, string moved)
    {
        using var client = _factory.WithWebHostBuilder(builder => builder.UseWebRoot(_webRoot))
            .CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using var response = await client.GetAsync(new Uri(url, UriKind.Relative));

        Assert.Equal(HttpStatusCode.MovedPermanently, response.StatusCode);
        Assert.Equal(moved, response.Headers.Location?.OriginalString);
    }

    [Fact]
    public async Task The_sitemap_lists_every_page_in_every_language_with_its_alternates()
    {
        using var response = await _client.GetAsync(new Uri("/sitemap.xml", UriKind.Relative));
        var xml = await response.Content.ReadAsStringAsync();

        Assert.Equal("application/xml", response.Content.Headers.ContentType?.MediaType);
        Assert.StartsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>", xml, StringComparison.Ordinal);
        Assert.Contains("xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"", xml, StringComparison.Ordinal);
        Assert.Contains("<loc>http://localhost/fr</loc>", xml, StringComparison.Ordinal);
        Assert.Contains("<loc>http://localhost/fr/dossiers</loc>", xml, StringComparison.Ordinal);
        Assert.Contains("<loc>http://localhost/fr/roulette</loc>", xml, StringComparison.Ordinal);
        Assert.Contains("<loc>http://localhost/es/ruleta</loc>", xml, StringComparison.Ordinal);
        Assert.Equal(5 * (3 + 30), Regex.Count(xml, "<url>"));
        Assert.Contains("<loc>http://localhost/de/akten/arachnophobia</loc>", xml, StringComparison.Ordinal);
        Assert.Contains("""<xhtml:link rel="alternate" hreflang="it" href="http://localhost/it/fascicoli/arachnophobia" />""", xml, StringComparison.Ordinal);
        Assert.DoesNotContain("mon-dossier", xml, StringComparison.Ordinal);
        Assert.DoesNotContain("my-file", xml, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Without_the_site_build_there_is_no_sitemap()
    {
        File.Delete(Path.Combine(_webRoot, "seo.json"));

        using var response = await _client.GetAsync(new Uri("/sitemap.xml", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Robots_may_crawl_the_site_but_not_the_api()
    {
        using var response = await _client.GetAsync(new Uri("/robots.txt", UriKind.Relative));
        var robots = await response.Content.ReadAsStringAsync();

        Assert.Equal("text/plain", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: http://localhost/sitemap.xml\n", robots);
    }

    [Fact]
    public void Head_texts_are_escaped()
    {
        var head = new PageHead("fr", "Tom & \"Jerry\" <3", "d", "", new Uri("http://localhost/og.jpg"), Indexable: true);
        var empty = new Dictionary<string, string>();
        var texts = new Dictionary<string, SeoTexts> { ["fr"] = new("fr_FR", "t", "d", empty, empty, empty) };

        var html = HeadHtml.Render(head, texts, new Uri("http://localhost/"));

        Assert.Contains("<title>Tom &amp; &quot;Jerry&quot; &lt;3</title>", html, StringComparison.Ordinal);
    }
}

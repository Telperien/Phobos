using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Phobos.Application;
using Phobos.Domain;
using Phobos.Infrastructure.Content;

namespace Phobos.Api.Tests;

public sealed class PhobiaEndpointsTests(PhobosApiFactory factory) : IClassFixture<PhobosApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private Task<HttpResponseMessage> GetAsync(string url) => _client.GetAsync(new Uri(url, UriKind.Relative));

    private async Task<T> GetJsonAsync<T>(string url)
    {
        using var response = await GetAsync(url);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }

    [Fact]
    public async Task Lists_the_seeded_catalogue_in_the_requested_language()
    {
        var list = await GetJsonAsync<List<PhobiaSummary>>("/api/fr/phobias");

        Assert.Equal(30, list.Count);
        Assert.Equal(
            new PhobiaSummary("arachnophobia", 1, "animals", "fr", "Arachnophobie", "du grec arákhnē, « araignée »", "Peur des araignées."),
            list[0]);
    }

    [Fact]
    public async Task Filters_the_catalogue_by_category()
    {
        var list = await GetJsonAsync<List<PhobiaSummary>>("/api/en/phobias?category=strange");

        Assert.Equal(["coulrophobia", "pediophobia", "phasmophobia", "aerophobia"], list.Select(phobia => phobia.Slug));
    }

    [Fact]
    public async Task Refuses_an_unknown_category()
    {
        using var response = await GetAsync("/api/en/phobias?category=monsters");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("'monsters'", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("/api/pt/phobias")]
    [InlineData("/api/pt/phobias/arachnophobia")]
    [InlineData("/api/pt/phobias/random")]
    public async Task Unsupported_languages_do_not_exist(string url)
    {
        using var response = await GetAsync(url);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Returns_a_case_file_with_its_five_levels()
    {
        var detail = await GetJsonAsync<PhobiaDetail>("/api/de/phobias/cynophobia");

        Assert.Equal(("Kynophobie", "de", 7), (detail.Name, detail.Language, detail.CaseNumber));
        Assert.Equal([1, 2, 3, 4, 5], detail.Levels.Select(level => level.Number));
    }

    [Fact]
    public async Task Returns_404_for_an_unknown_case_file()
    {
        using var response = await GetAsync("/api/fr/phobias/unknown");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Serves_the_media_listed_in_a_case_file()
    {
        var sharks = PhobiaContent.LoadShipped().Single(phobia => phobia.Slug == "selachophobia");
        sharks.AddMedia(ExposureMedia.Image(1, "selachophobia/1-a.webp", ImageCredit.Generated));
        sharks.AddMedia(ExposureMedia.YouTube("dQw4w9WgXcQ", startSeconds: 30));
        using var client = factory
            .WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
                services.AddSingleton<IPhobiaCatalogue>(new ContentPhobiaCatalogue([sharks]))))
            .CreateClient();

        var detail = await client.GetFromJsonAsync<PhobiaDetail>(new Uri("/api/it/phobias/selachophobia", UriKind.Relative));

        Assert.Equal([new MediaView("image", "/media/selachophobia/1-a.webp", 0)], detail!.Levels[0].Media);
        Assert.Empty(detail.Levels[1].Media);
        Assert.Equal([new MediaView("youtube", "dQw4w9WgXcQ", 30)], detail.Levels[4].Media);
    }

    [Fact]
    public async Task Draws_a_case_file_not_seen_yet()
    {
        var seen = await AllSlugsExceptAsync("trypophobia");

        var drawn = await GetJsonAsync<PhobiaDetail>($"/api/es/phobias/random?seen={seen}");

        Assert.Equal(("trypophobia", "Tripofobia"), (drawn.Slug, drawn.Name));
    }

    [Fact]
    public async Task Never_draws_an_excluded_case_file()
    {
        var exclude = await AllSlugsExceptAsync("pediophobia");

        var drawn = await GetJsonAsync<PhobiaDetail>($"/api/fr/phobias/random?exclude={exclude}");

        Assert.Equal("pediophobia", drawn.Slug);
    }

    [Fact]
    public async Task Answers_no_content_once_every_case_file_is_excluded()
    {
        var exclude = await AllSlugsExceptAsync("none");

        using var response = await GetAsync($"/api/fr/phobias/random?exclude={exclude}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    private async Task<string> AllSlugsExceptAsync(string kept)
    {
        var all = await GetJsonAsync<List<PhobiaSummary>>("/api/fr/phobias");
        return string.Join(',', all.Select(phobia => phobia.Slug).Where(slug => slug != kept));
    }

    [Fact]
    public async Task Draws_from_the_whole_catalogue_at_the_start_of_a_round()
    {
        var drawn = await GetJsonAsync<PhobiaDetail>("/api/fr/phobias/random");

        Assert.Equal("fr", drawn.Language);
        Assert.InRange(drawn.CaseNumber, 1, 30);
    }

    [Fact]
    public async Task Streams_an_image_from_the_media_folder()
    {
        Directory.CreateDirectory(Path.Combine(factory.MediaRoot, "acrophobia"));
        await File.WriteAllTextAsync(Path.Combine(factory.MediaRoot, "acrophobia", "1-a.webp"), "image bytes");

        using var response = await GetAsync("/media/acrophobia/1-a.webp");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("image/webp", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("image bytes", await response.Content.ReadAsStringAsync());
        Assert.Equal(TimeSpan.FromDays(1), response.Headers.CacheControl?.MaxAge);
    }

    [Theory]
    [InlineData("/media/acrophobia/missing.webp")]
    [InlineData("/media/..%2Fsecret.webp")]
    public async Task Returns_404_for_a_missing_or_forbidden_image(string url)
    {
        using var response = await GetAsync(url);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}

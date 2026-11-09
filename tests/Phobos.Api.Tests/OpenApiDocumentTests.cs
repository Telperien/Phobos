using System.Net;
using System.Text.Json;

namespace Phobos.Api.Tests;

public sealed class OpenApiDocumentTests(PhobosApiFactory factory) : IClassFixture<PhobosApiFactory>
{
    [Fact]
    public async Task Describes_the_phobia_endpoints_with_their_response_shapes()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(new Uri("/openapi/v1.json", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var paths = document.RootElement.GetProperty("paths");
        Assert.True(paths.TryGetProperty("/api/{lang}/phobias", out _));
        Assert.True(paths.TryGetProperty("/api/{lang}/phobias/{slug}", out _));
        Assert.True(paths.TryGetProperty("/api/{lang}/phobias/random", out _));
        var schemas = document.RootElement.GetProperty("components").GetProperty("schemas");
        Assert.True(schemas.TryGetProperty("PhobiaSummary", out _));
        Assert.True(schemas.TryGetProperty("PhobiaDetail", out _));
    }

    [Fact]
    public async Task Numbers_are_plain_integers_for_the_typed_front_end_client()
    {
        using var client = factory.CreateClient();

        var json = await client.GetStringAsync(new Uri("/openapi/v1.json", UriKind.Relative));

        using var document = JsonDocument.Parse(json);
        var caseNumber = document.RootElement.GetProperty("components").GetProperty("schemas")
            .GetProperty("PhobiaSummary").GetProperty("properties").GetProperty("caseNumber");
        Assert.Equal("integer", caseNumber.GetProperty("type").GetString());
    }
}

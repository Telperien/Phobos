using System.Net;
using System.Net.Http.Json;

namespace Phobos.Api.Tests;

public sealed class HealthEndpointTests(PhobosApiFactory factory) : IClassFixture<PhobosApiFactory>
{
    [Fact]
    public async Task Health_endpoint_reports_the_api_is_up()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(new Uri("/api/health", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();
        Assert.Equal("ok", body?.Status);
    }

    private sealed record HealthResponse(string Status);
}

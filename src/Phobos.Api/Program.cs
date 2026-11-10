using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using Phobos.Api;
using Phobos.Api.Site;
using Phobos.Application;
using Phobos.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddPhobosInfrastructure(builder.Configuration, builder.Environment.ContentRootPath);
builder.Services.AddScoped<PhobiaQueries>();
builder.Services.AddScoped<PageHeads>();
builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict);
builder.Services.AddOpenApi();
// App Service terminates HTTPS in front of the app: trust its X-Forwarded-Proto so absolute links stay https.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();
app.UseForwardedHeaders();
app.UseStaticFiles();

app.MapOpenApi();
app.MapGet("/api/health", () => new { Status = "ok" });
app.MapPhobiaEndpoints();

// The built site lives in wwwroot: any other page goes to index.html (with a head written for that page)
// so the React router decides, except under /api where an unknown route must stay a 404.
app.MapFallback("/api/{**path}", () => Results.NotFound()).ExcludeFromDescription();
app.MapSite();

await app.RunAsync();

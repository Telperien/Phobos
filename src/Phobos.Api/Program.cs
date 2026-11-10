using System.IO.Compression;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.ResponseCompression;
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

// No cookie or secret ever travels in a response, so compressing over HTTPS is safe here. Static files are
// compressed over HTTPS anyway; EnableForHttps covers the generated responses (pages, JSON, sitemap).
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(["image/svg+xml"]);
});
// The default favours speed over size (Brotli came out larger than gzip); assets are then cached for a year.
builder.Services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Optimal);
builder.Services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Optimal);

var app = builder.Build();
app.UseForwardedHeaders();
app.UseResponseCompression();
app.UseStaticFiles(new StaticFileOptions { OnPrepareResponse = SiteCaching.ForStaticFile });

app.MapOpenApi();
app.MapGet("/api/health", () => new { Status = "ok" });
app.MapPhobiaEndpoints();

// The built site lives in wwwroot: any other page goes to index.html (with a head written for that page)
// so the React router decides, except under /api where an unknown route must stay a 404.
app.MapFallback("/api/{**path}", () => Results.NotFound()).ExcludeFromDescription();
app.MapSite();

await app.RunAsync();

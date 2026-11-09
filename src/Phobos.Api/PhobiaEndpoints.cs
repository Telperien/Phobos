using Phobos.Application;
using Phobos.Domain;

namespace Phobos.Api;

public static class PhobiaEndpoints
{
    public static void MapPhobiaEndpoints(this IEndpointRouteBuilder app)
    {
        var phobias = app.MapGroup("/api/{lang}/phobias");
        phobias.MapGet("/", ListAsync);
        phobias.MapGet("/random", DrawAsync);
        phobias.MapGet("/{slug}", GetAsync);

        app.MapGet("/media/{**key}", ServeMediaAsync);
    }

    private static async Task<IResult> ListAsync(
        string lang, string? category, PhobiaQueries queries, CancellationToken cancellationToken)
    {
        if (!Languages.TryParse(lang, out var language)) return Results.NotFound();

        Category? filter = null;
        if (category is not null)
        {
            if (!CategoryCodes.TryParse(category, out var parsed)) return Results.BadRequest($"Unknown category '{category}'.");
            filter = parsed;
        }

        return Results.Ok(await queries.ListAsync(language, filter, cancellationToken));
    }

    private static async Task<IResult> GetAsync(
        string lang, string slug, PhobiaQueries queries, CancellationToken cancellationToken)
    {
        if (!Languages.TryParse(lang, out var language)) return Results.NotFound();
        return OkOrNotFound(await queries.GetAsync(language, slug, cancellationToken));
    }

    /// <param name="seen">Comma-separated slugs already shown in this roulette round.</param>
    private static async Task<IResult> DrawAsync(
        string lang, string? seen, PhobiaQueries queries, CancellationToken cancellationToken)
    {
        if (!Languages.TryParse(lang, out var language)) return Results.NotFound();
        return OkOrNotFound(await queries.DrawAsync(language, seen?.Split(',') ?? [], cancellationToken));
    }

    private static async Task<IResult> ServeMediaAsync(string key, IMediaStore store, CancellationToken cancellationToken)
    {
        var file = await store.OpenReadAsync(key, cancellationToken);
        return file is null ? Results.NotFound() : Results.Stream(file.Content, file.ContentType);
    }

    private static IResult OkOrNotFound(PhobiaDetail? detail) => detail is null ? Results.NotFound() : Results.Ok(detail);
}

using Microsoft.AspNetCore.Http.HttpResults;
using Phobos.Api.Site;
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

        app.MapGet("/media/{**key}", ServeMediaAsync).ExcludeFromDescription();
    }

    private static async Task<Results<Ok<IReadOnlyList<PhobiaSummary>>, NotFound, BadRequest<string>>> ListAsync(
        string lang, string? category, PhobiaQueries queries, CancellationToken cancellationToken)
    {
        if (!Languages.TryParse(lang, out var language)) return TypedResults.NotFound();

        Category? filter = null;
        if (category is not null)
        {
            if (!CategoryCodes.TryParse(category, out var parsed)) return TypedResults.BadRequest($"Unknown category '{category}'.");
            filter = parsed;
        }

        return TypedResults.Ok(await queries.ListAsync(language, filter, cancellationToken));
    }

    private static async Task<Results<Ok<PhobiaDetail>, NotFound>> GetAsync(
        string lang, string slug, PhobiaQueries queries, CancellationToken cancellationToken)
    {
        if (!Languages.TryParse(lang, out var language)) return TypedResults.NotFound();
        return OkOrNotFound(await queries.GetAsync(language, slug, cancellationToken));
    }

    /// <param name="seen">Comma-separated slugs already shown in this roulette round, oldest first.</param>
    /// <param name="exclude">Comma-separated slugs never to draw (for example, phobias already faced).</param>
    /// <returns>A case file, or 204 when every published case file is excluded.</returns>
    private static async Task<Results<Ok<PhobiaDetail>, NoContent, NotFound>> DrawAsync(
        string lang, string? seen, string? exclude, PhobiaQueries queries, CancellationToken cancellationToken)
    {
        if (!Languages.TryParse(lang, out var language)) return TypedResults.NotFound();
        var drawn = await queries.DrawAsync(language, SlugList(seen), SlugList(exclude), cancellationToken);
        return drawn is null ? TypedResults.NoContent() : TypedResults.Ok(drawn);
    }

    private static string[] SlugList(string? commaSeparated) => commaSeparated?.Split(',') ?? [];

    private static async Task<IResult> ServeMediaAsync(
        string key, HttpContext context, IMediaStore store, CancellationToken cancellationToken)
    {
        var file = await store.OpenReadAsync(key, cancellationToken);
        if (file is null) return TypedResults.NotFound();
        context.Response.Headers.CacheControl = SiteCaching.Image;
        return TypedResults.Stream(file.Content, file.ContentType);
    }

    private static Results<Ok<PhobiaDetail>, NotFound> OkOrNotFound(PhobiaDetail? detail) =>
        detail is null ? TypedResults.NotFound() : TypedResults.Ok(detail);
}

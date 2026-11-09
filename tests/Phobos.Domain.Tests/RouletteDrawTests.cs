namespace Phobos.Domain.Tests;

public sealed class RouletteDrawTests
{
    private static readonly string[] Deck = ["arachnophobia", "acrophobia", "coulrophobia"];

    private static string Slug(string slug) => slug;

    [Fact]
    public void Picks_among_the_phobias_not_seen_yet()
    {
        var askedFor = new List<int>();

        var picked = RouletteDraw.Pick(Deck, seen: ["acrophobia"], Slug, count => { askedFor.Add(count); return 1; });

        Assert.Equal("coulrophobia", picked);
        Assert.Equal([2], askedFor);
    }

    [Fact]
    public void Starts_a_new_round_once_every_phobia_has_been_seen()
    {
        var picked = RouletteDraw.Pick(Deck, seen: Deck, Slug, _ => 2);

        Assert.Equal("coulrophobia", picked);
    }

    [Fact]
    public void Ignores_seen_slugs_that_are_not_in_the_deck()
    {
        var picked = RouletteDraw.Pick(Deck, seen: ["unknown"], Slug, _ => 0);

        Assert.Equal("arachnophobia", picked);
    }

    [Fact]
    public void Returns_nothing_from_an_empty_deck()
    {
        Assert.Null(RouletteDraw.Pick<string>([], seen: [], Slug, _ => 0));
    }
}

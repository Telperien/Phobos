namespace Phobos.Domain;

/// <summary>
/// Random draw without repetition: an item comes back only once the whole deck has been seen,
/// and a new round never starts with the item just shown.
/// </summary>
public static class RouletteDraw
{
    /// <param name="seen">Keys already shown in this round, oldest first.</param>
    /// <param name="keyOf">Identifies an item among the <paramref name="seen"/> keys.</param>
    /// <param name="nextIndex">Returns an index between 0 (included) and the given count (excluded).</param>
    public static T? Pick<T>(
        IReadOnlyList<T> deck, IReadOnlyList<string> seen, Func<T, string> keyOf, Func<int, int> nextIndex)
        where T : class
    {
        var unseen = deck.Where(item => !seen.Contains(keyOf(item))).ToList();
        var pool = unseen.Count > 0 ? unseen : NewRound(deck, seen.Count > 0 ? seen[^1] : null, keyOf);
        return pool.Count == 0 ? null : pool[nextIndex(pool.Count)];
    }

    private static IReadOnlyList<T> NewRound<T>(IReadOnlyList<T> deck, string? justShown, Func<T, string> keyOf)
    {
        var others = deck.Where(item => keyOf(item) != justShown).ToList();
        return others.Count > 0 ? others : deck;
    }
}

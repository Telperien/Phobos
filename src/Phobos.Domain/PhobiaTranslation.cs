namespace Phobos.Domain;

public sealed record PhobiaTranslation(
    Language Language, string Name, string Etymology, string Summary, string Description, string Annotation);

export class Compressor
{
    public static compress(input: string) : string
    {
        return input.replace(/\\t\\n/g,'');
    }
}
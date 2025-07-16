export class Compressor
{
    public static compress(input: string) : string
    {
        return input.replace(/\s*[\r\n]\s*/g,'')
            .replace(/^\s*/g,'')
            .replace(/\s*(&&)\s*/g,'&&')
            .replace(/\s*(\|\|)\s*/g,'||')
            .replace(/\s*(!=)\s*/g,'!=')
            .replace(/\s*(=)\s*/g,'=')
            .replace(/\s*(>)\s*/g,'>')
            .replace(/\s*(<)\s*/g,'<')
            .replace(/\s*(>=)\s*/g,'>=')
            .replace(/\s*(<=)\s*/g,'<=');
    }
}
export class Compressor
{
    public static compress(input: string) : string
    {
        return input.replace(/[\t\n\r]/g,'')
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
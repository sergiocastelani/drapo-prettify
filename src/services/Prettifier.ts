class Prettifier 
{
    private readonly NUMERIC = new Set("0123456789");
    private readonly ALPHA = new Set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    private readonly VARIABLE = new Set("_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    private readonly ALPHANUMERIC = new Set("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");

    private input : string = "";
    private parserPosition: number = 0;
    private stepStack : PrettifierStep[] = [PrettifierStep.FunctionName, PrettifierStep.Spaces];

    private output : string = "";
    private outputStartMarker : number = 0;
    private outputIdentation : number = 0;

    public parse(input : string) : string 
    {
        this.input = input;
        this.parserPosition = 0;
        this.stepStack = [PrettifierStep.FunctionName, PrettifierStep.Spaces];
        this.output = "";
        this.outputStartMarker = 0;
        this.outputIdentation = 0;

        while (this.parserPosition < this.input.length)
        {
            switch (this.stepStack[this.stepStack.length-1])
            {
                case PrettifierStep.DumpOutputLine:
                    this.dumpOutputLineStep();
                    break;
                case PrettifierStep.IncOutputIdentation:
                    this.outputIdentation++;
                    this.stepStack.pop();
                    break;
                case PrettifierStep.DecOutputIdentation:
                    this.outputIdentation--;
                    this.stepStack.pop();
                    break;
                case PrettifierStep.Spaces:
                    this.spaceStep();
                    break;
                case PrettifierStep.FunctionName:
                    this.functionNameStep();
                    break;
                case PrettifierStep.OpenParentheses:
                    this.jumpChar("(");
                    this.stepStack.pop();
                    break;
                case PrettifierStep.CloseParentheses:
                    this.jumpChar(")");
                    this.stepStack.pop();
                    break;
                // case PrettifierStep.:
                //     break;
                default:
                    break;
            }
        }

        return this.output;
    }

    private dumpOutputLineStep()
    {
        this.stepStack.pop();
        this.output +=  "  ".repeat(this.outputIdentation) + this.input.slice(this.outputStartMarker, this.parserPosition) + "\n";
        this.outputStartMarker = this.parserPosition;
    }

    private spaceStep() 
    {
        if (this.input[this.parserPosition] == " ")
            this.parserPosition++;
        else
            this.stepStack.pop();
    }

    private functionNameStep() 
    {
        if (this.VARIABLE.has(this.input[this.parserPosition]))
            this.parserPosition++;
        else
        {
            this.stepStack.pop();
            this.stepStack.push(PrettifierStep.CloseParentheses, PrettifierStep.Spaces, PrettifierStep.Parameter, PrettifierStep.Spaces, PrettifierStep.OpenParentheses, PrettifierStep.Spaces);
        }
    }

    private jumpChar(char: string)
    {
        if (this.input[this.parserPosition] != char)
            throw `Parser error: expecting char '${char}'`;
        this.parserPosition++;
    }
}

enum PrettifierStep 
{
    DumpOutputLine,
    IncOutputIdentation,
    DecOutputIdentation,
    Spaces,
    FunctionName,
    OpenParentheses,
    Parameter,
    CloseParentheses,
    Mustache,
    Expression,
}
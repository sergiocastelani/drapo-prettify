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
    private inputLineStartMarker : number = 0;
    private outputIdentation : number = 0;

    public parse(input : string) : string 
    {
        this.input = input;
        this.parserPosition = 0;
        this.stepStack = [PrettifierStep.FunctionName, PrettifierStep.Spaces];
        this.output = "";
        this.inputLineStartMarker = 0;
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
                case PrettifierStep.Parameter:
                    this.parameterStep();
                    break;
                case PrettifierStep.Expression:
                    this.expressionStep();
                    break;
                // case PrettifierStep.:
                //     break;
                default:
                    break;
            }
        }
        this.dumpOutputLineStep();
        return this.output;
    }

    private parserError(message: string)
    {
        throw "Parser error: " + message + ". Parsed data: " + this.input.slice(0, this.parserPosition+1);
    }

    private dumpOutputLineStep()
    {
        this.stepStack.pop();
        this.output +=  "  ".repeat(this.outputIdentation) + this.input.slice(this.inputLineStartMarker, this.parserPosition) + "\n";
        this.inputLineStartMarker = this.parserPosition;
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
            this.parserError(`expecting char '${char}'`);
        this.parserPosition++;
    }

    private parameterStep()
    {
        const nextChar = this.input[this.parserPosition]
        if (nextChar == "(" || nextChar == "{" || nextChar == "!")
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.Expression);
        else if (nextChar == ",")
        {
            this.jumpChar(",");
            this.stepStack.push(PrettifierStep.Spaces);
        }
        else if (this.VARIABLE.has(nextChar))
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.FunctionName)
        else if (nextChar == ")")
            this.stepStack.pop();
        else
            this.parserError("Unexpected char");
    }

    private expressionStep()
    {
        const nextChar = this.input[this.parserPosition];
        let nextChar2 = nextChar + this.input[this.parserPosition+1];
        if (nextChar == "(")
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.CloseParentheses, PrettifierStep.Spaces, PrettifierStep.Expression, PrettifierStep.Spaces, PrettifierStep.OpenParentheses);
        else if (nextChar2 == "!=" || nextChar == "&&" || nextChar == "||")
        {
            this.parserPosition += 2;
            this.stepStack.push(PrettifierStep.Spaces);
        }
        else if (nextChar == "!")
        {
            this.parserPosition++;
            this.stepStack.push(PrettifierStep.Spaces);
        }
        else if (nextChar == "=")
        {
            this.parserPosition++;
            this.stepStack.push(PrettifierStep.Spaces);
        }
        else if (nextChar == "{")
        {
            while ((nextChar2 != "}}") && (this.parserPosition < this.input.length))
            {
                this.parserPosition++;
                nextChar2 = this.input.slice(this.parserPosition, this.parserPosition+2);
            }
            this.parserPosition += 2;
            this.stepStack.push(PrettifierStep.Spaces);
        }
        else
            this.stepStack.pop();
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
    CloseParentheses,
    Parameter,
    Mustache,
    Expression,
}
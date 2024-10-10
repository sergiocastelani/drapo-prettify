import { Compressor } from "./Compressor";

export class Prettifier 
{
    private readonly VARIABLE = new Set("-_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");

    private input : string = "";
    private parserPosition: number = 0;
    private stepStack : PrettifierStep[] = [PrettifierStep.Spaces, PrettifierStep.Block, PrettifierStep.Spaces];

    private output : string = "";
    private inputLineStartMarker : number = 0;
    private outputIdentation : number = 0;

    public parse(input : string) : string 
    {
        this.input = Compressor.compress(input);
        this.parserPosition = 0;
        this.stepStack = [PrettifierStep.Spaces, PrettifierStep.Block, PrettifierStep.Spaces];
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
                case PrettifierStep.Block:
                    this.blockStep();
                    break;
                case PrettifierStep.FunctionName:
                    this.functionNameStep();
                    break;
                case PrettifierStep.VariableName:
                    this.variableNameStep();
                    break;
                case PrettifierStep.Mustache:
                    this.mustacheStep();
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
                case PrettifierStep.IfComma:
                    this.ifCommaStep();
                    break;
                case PrettifierStep.Comma:
                    this.jumpChar(",");
                    this.stepStack.pop();
                    break;
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
        this.output +=  "  ".repeat(this.outputIdentation) + this.input.slice(this.inputLineStartMarker, this.parserPosition).trim() + "\n";
        this.inputLineStartMarker = this.parserPosition;
    }

    private spaceStep() 
    {
        if (this.input[this.parserPosition] == " ")
            this.parserPosition++;
        else
            this.stepStack.pop();
    }

    private blockStep()
    {
        const nextChar = this.input[this.parserPosition];
        if (nextChar == ";")
        {
            this.parserPosition++;
            this.stepStack.push(PrettifierStep.DumpOutputLine, PrettifierStep.Spaces);
        }
        else if (this.VARIABLE.has(nextChar))
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.FunctionName);
        else
            this.stepStack.pop();
    }

    private lastFunctionName : string = "";
    private functionNameStep() 
    {
        const nextChar = this.input[this.parserPosition];
        if (this.VARIABLE.has(nextChar))
        {
            this.lastFunctionName += nextChar;
            this.parserPosition++;
        }
        else
        {
            this.stepStack.pop();
            if (this.lastFunctionName.toLowerCase() == "if")
            {
                this.stepStack.push(
                    PrettifierStep.CloseParentheses,
                    PrettifierStep.DecOutputIdentation,
                    PrettifierStep.DumpOutputLine,
                    PrettifierStep.IfComma,
                    PrettifierStep.IfComma,
                    PrettifierStep.Spaces,
                    PrettifierStep.Expression,
                    PrettifierStep.IncOutputIdentation,
                    PrettifierStep.DumpOutputLine,
                    PrettifierStep.Spaces,
                    PrettifierStep.OpenParentheses, 
                    PrettifierStep.Spaces
                );    
            }
            else if (this.lastFunctionName.length > 0)
            {
                this.stepStack.push(
                    PrettifierStep.Spaces, 
                    PrettifierStep.CloseParentheses, 
                    PrettifierStep.Spaces, 
                    PrettifierStep.Parameter, 
                    PrettifierStep.Spaces,
                    PrettifierStep.OpenParentheses, 
                    PrettifierStep.Spaces
                );
            }
            this.lastFunctionName = "";
        }
    }

    private ifCommaStep()
    {
        this.stepStack.pop();
        const nextChar = this.input[this.parserPosition];
        if (nextChar == ",")
        {
            this.stepStack.push(
                PrettifierStep.Spaces,
                PrettifierStep.Block,
                PrettifierStep.DumpOutputLine,
                PrettifierStep.Spaces,
                PrettifierStep.Comma,
                PrettifierStep.DumpOutputLine,
            );
        }
    }

    private variableNameStep() 
    {
        const nextChar = this.input[this.parserPosition];
        if (this.VARIABLE.has(nextChar))
            this.parserPosition++;
        else
            this.stepStack.pop();
    }

    private mustacheStep() 
    {
        if (this.input[this.parserPosition] == "{")
        {
            let nextChar2 = this.input.slice(this.parserPosition, this.parserPosition+2);
            while ((nextChar2 != "}}") && (this.parserPosition < this.input.length))
            {
                this.parserPosition++;
                nextChar2 = this.input.slice(this.parserPosition, this.parserPosition+2);
            }
            this.parserPosition += 2;
        }
        this.stepStack.pop();
    }

    private jumpChar(char: string)
    {
        if (this.input[this.parserPosition] != char)
            this.parserError(`expecting char '${char}'`);
        this.parserPosition++;
    }

    private parameterStep()
    {
        const nextChar = this.input[this.parserPosition];
        if (nextChar == "(" || nextChar == "{" || nextChar == "!")
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.Expression);
        else if (nextChar == ",")
        {
            this.parserPosition++;
            this.stepStack.push(PrettifierStep.Spaces);
        }
        else if (this.VARIABLE.has(nextChar))
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.VariableName)
        else if (nextChar == ")")
            this.stepStack.pop();
        else
            this.parserError("Unexpected char");
    }

    private expressionStep()
    {
        const nextChar = this.input[this.parserPosition];
        const nextChar2 = nextChar + this.input[this.parserPosition+1];
        if (nextChar == "(")
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.CloseParentheses, PrettifierStep.Spaces, PrettifierStep.Expression, PrettifierStep.Spaces, PrettifierStep.OpenParentheses);
        else if (nextChar2 == "&&" || nextChar2 == "||")
        {
            this.input = this.input.slice(0, this.parserPosition) + ` ${nextChar2} ` + this.input.slice(this.parserPosition + 2);
            this.parserPosition += 4;
            this.stepStack.push(PrettifierStep.Spaces);
        }
        else if (nextChar2 == "!=")
        {
            this.input = this.input.slice(0, this.parserPosition) + ` ${nextChar2} ` + this.input.slice(this.parserPosition + 2);
            this.parserPosition += 4;
            this.stepStack.push(PrettifierStep.Mustache, PrettifierStep.VariableName, PrettifierStep.Spaces);
        }
        else if (nextChar == "!")
        {
            this.parserPosition++;
            this.stepStack.push(PrettifierStep.Mustache, PrettifierStep.Spaces);
        }
        else if (nextChar == "=")
        {
            this.parserPosition++;
            this.stepStack.push(PrettifierStep.Mustache, PrettifierStep.VariableName, PrettifierStep.Spaces);
        }
        else if (nextChar == "{")
        {
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.Mustache);
        }
        else if (this.VARIABLE.has(nextChar))
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.FunctionName)
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
    Block,
    FunctionName,
    VariableName,
    Mustache,
    OpenParentheses,
    CloseParentheses,
    Parameter,
    Expression,
    IfComma,
    Comma,
}
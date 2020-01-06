import { notEqual } from "assert";
import { linkRelationProperty } from "rdflib/lib/util";
import MainController from "./MainController";

export default class ImagController extends MainController {

    constructor()
    {
        super();
        this.ontoModel = [];
    }

    createGraph = (ontoModel) =>
    {
        this.ontoModel = ontoModel;
        let graphCommand = "classDiagram\n"; 


        for (let node of this.ontoModel)
        {
            if (node["type"] === "relation" && this.findLabel(node.to) !== false && this.findLabel(node.from) !== false) {
                if (node.ontoType === "Arrow")
                {
                    graphCommand += this.findLabel(node.to)  + " --|> " +  this.findLabel(node.from) + "\n"; 
                }
                else if (node.ontoType === "Relator")
                {
                    if (node.from && node.to) 
                    {
                       let fromT = node.fromType;
                        let toT = node.toType;

                    
                        graphCommand += 'class '+ node.label + `{
                                <<`+ node.ontoType + `>>
                        }\n`;   
                        
                        graphCommand += this.findLabel(node.from) +" "+ (fromT ? '"'+fromT[0]+'"' : "") +" .. "+ (toT ? '"'+fromT[1]+'"' : "") + " " + node.label +  " : <<Mediation>>\n"; 
                        graphCommand += node.label +" "+ (toT ? '"'+toT[0]+'"' : "") +" .. "+ (toT ? '"'+toT[1]+'"' : "") + " " + this.findLabel(node.to) + " : <<Mediation>>\n"; 
                    }
                }
                else
                {
                    // může být i noType -
                    let fromT = node.fromType;
                    let toT = node.toType;
                
                    graphCommand += this.findLabel(node.from) +" "+ (fromT ? '"'+fromT+'"' : "") +" .. "+ (toT ? '"'+toT+'"' : "") + " " + this.findLabel(node.to) + (node.ontoType === "Row" ? "" : " : <<"+node.ontoType+">>") + "\n"; 
                }

            }
            else if (node["type"] !== "relation")
            {
              
                graphCommand += 'class '+ node.label + `{
                    <<`+ node.ontoType + `>>
                }\n`;   
            }
        }
        return graphCommand = (graphCommand.trim() === "classDiagram") ? false : graphCommand; 
    }

    findLabel (uri)
    {
        for (let node of this.ontoModel)
        {
            if (node.uri === uri)
            {
                return node.label;
            }
        }

        return false;

    }

}
import { notEqual } from "assert";
import { linkRelationProperty } from "rdflib/lib/util";

export default class ImagController {

    createGraph = (ontoModel) =>
    {

        let graphCommand = "classDiagram\n"; 


        for (let node of ontoModel)
        {
            if (node["type"] === "relation" && node.from !== "" && node.to !== "") {
                console.log(node)
                if (node.ontoType === "Arrow")
                {
                    graphCommand += node.to.split('#')[1]  + " --|> " +  node.from.split('#')[1] + "\n"; 
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
                        
                        graphCommand += node.from.split('#')[1] +" "+ (fromT ? '"'+fromT[0]+'"' : "") +" .. "+ (toT ? '"'+fromT[1]+'"' : "") + " " + node.label +  " : <<Mediation>>\n"; 
                        graphCommand += node.label +" "+ (toT ? '"'+toT[0]+'"' : "") +" .. "+ (toT ? '"'+toT[1]+'"' : "") + " " + node.to.split('#')[1] + " : <<Mediation>>\n"; 
                    }
                }
                else
                {
                    // může být i noType -
                    let fromT = node.fromType;
                    let toT = node.toType;
                
                    graphCommand +=node.from.split('#')[1] +" "+ (fromT ? '"'+fromT+'"' : "") +" .. "+ (toT ? '"'+toT+'"' : "") + " " + node.to.split('#')[1] + (node.ontoType === "Row" ? "" : " : <<"+node.ontoType+">>") + "\n"; 
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

}
import { notEqual } from "assert";

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
                    let fromT, toT; 

                    if (node.ontoType === "Relator")
                    {
                        graphCommand += 'class '+ node.label + `{
                            <<`+ node.ontoType + `>>
                        }\n`;   
                    }
                    graphCommand += node.from.split('#')[1] +" "+ (fromT ? fromT : "") +" .. "+ (toT ? toT : "") + " " + node.label +  " : <<Mediation>>\n"; 
                    graphCommand += node.label +" "+ (fromT ? fromT : "") +" .. "+ (toT ? toT : "") + " " + node.to.split('#')[1] + " : <<Mediation>>\n"; 
                }
                else
                {
                    // může být i noType -
                    let fromT, toT; 
                
                    graphCommand += node.from.split('#')[1] +" "+ (fromT = fromT ? fromT : "") +" .. "+ (toT = toT ? toT : "") + " " + node.to.split('#')[1] + " : " + "<<"+node.ontoType+">>" + " \n"; 
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
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


                    graphCommand += node.from.split('#')[1] + " --|> " + node.to.split('#')[1] + "\n"; 
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
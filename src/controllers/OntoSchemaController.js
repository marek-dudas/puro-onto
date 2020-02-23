
export default class OntoScheController {

    
    transform (ontoModel)
    {
        const ontoUmlSchema = this.schemaInit(); 
        let relCount = 0; 

        for (let node of ontoModel)
        {
            if(node.type === "Class" || node.ontoType.toLowerCase() === "relator")
            {
              ontoUmlSchema["contents"].push(this.ontoClassTransformation(node)); 
            }
        }

        // Relations have to be added at the end 
        for (let node of ontoModel)
        {
          if (node.type === "relation" && node.ontoType.toLowerCase() !== "relator") {
            ontoUmlSchema["contents"].push(this.relationTransformation(node, relCount));
            relCount += 2;  
          }
          else if (node.ontoType.toLowerCase() === "relator")
          {
            let nodeCopy = JSON.parse(JSON.stringify(node));
            let nodeCopy2 = JSON.parse(JSON.stringify(node));  
            nodeCopy["uri"] += "rel1"
            nodeCopy2["uri"] += "rel2"
            nodeCopy["ontoType"] += "mediation"
            nodeCopy2["ontoType"] += "mediation"
            
            nodeCopy["fromType"] = node["fromType"][0]; 
            nodeCopy["toType"] = node["fromType"][1];
            
            nodeCopy2["fromType"] = node["toType"][0];
            nodeCopy2["toType"] = node["toType"][1]

            nodeCopy["to"] += node.uri;
            nodeCopy2["from"] += node.uri;
            
            ontoUmlSchema["contents"].push(this.relationTransformation(nodeCopy, relCount));
            relCount += 2;  
            ontoUmlSchema["contents"].push(this.relationTransformation(nodeCopy2, relCount));
            relCount += 2;  
          }
        }

        const schemas = require('ontouml-schema');
        const Ajv = require('ajv');
        const validator = new Ajv().compile(schemas.getSchema(schemas.ONTOUML_2));
        this.ontoModel = this.initJson();
       
        const isValid = validator(ontoUmlSchema);

        if (isValid)
        {
          return ontoUmlSchema; 
        }
        else
        {
          alert("Model is not valid! Check OntoSchemaCotroller!"); 
        }
    }

    schemaInit ()
    {
        return {
            "type": "Package",
            "id": "puroConversion",
            "name": null,
            "description": null,
            "contents": [],
            "propertyAssignments": null
            }
    }

    ontoClassTransformation (ontoClass)
    {
      return  {
            "type": "Class",
            "id": ontoClass.uri ,
            "name": ontoClass.label,
            "description": null,
            "properties": null,
            "literals": null,
            "propertyAssignments": null,
            "stereotypes": [ontoClass.ontoType.toLowerCase()],
            "isAbstract": null,
            "isDerived": null
            }
    }

    relationTransformation (relation, relCount)
    {

        if (relation.ontoType === "Generalization")
        {
             return {
                "type": "Generalization",
                "id": relation.uri,
                "name": null,
                "description": null,
                "general": {
                  "type": "Class",
                  "id": relation.from
                },
                "specific": {
                  "type": "Class",
                  "id": relation.to
                },
                "propertyAssignments": {
                  "nonStandardProperty": null
                }
              };
        }
        else
        {
            return {
              "type": "Relation",
              "id": relation.uri,
              "name": null,
              "description": null,
              "properties": [
                {
                  "type": "Property",
                  "id": "prop" + relCount,
                  "name": null,
                  "description": null,
                  "propertyType": {
                    "type": "Class",
                    "id": relation.from
                  },
                  "cardinality": relation.fromType === "" ? null : relation.fromType,
                  "isDerived": null,
                  "isOrdered": null,
                  "isReadOnly": null,
                  "stereotypes": null,
                  "propertyAssignments": null,
                  "subsettedProperties": null,
                  "redefinedProperties": null,
                  "aggregationKind": null
                },
                {
                  "type": "Property",
                  "id": "prop" + (parseInt(relCount) + 1),
                  "name": null,
                  "description": null,
                  "propertyType": {
                    "type": "Class",
                    "id": relation.to
                  },
                  "cardinality": relation.toType === "" ? null : relation.toType,
                  "isDerived": null,
                  "isOrdered": null,
                  "isReadOnly": null,
                  "stereotypes": null,
                  "propertyAssignments": null,
                  "subsettedProperties": null,
                  "redefinedProperties": null,
                  "aggregationKind": null
                }
              ],
              "propertyAssignments": {
                "nonStandardProperty": null
              },
              "stereotypes": [relation.ontoType.toLowerCase()],
              "isAbstract": true,
              "isDerived": false
            }
        }


    }

    initJson()
    {
      return JSON.parse(`[
        {
          "type": "relation",
          "ontoType": "Characterization",
          "from": "http://lod2-dev.vse.cz/data/puromodels#Book",
          "to": "http://lod2-dev.vse.cz/data/puromodels#Topic",
          "uri": "http://lod2-dev.vse.cz/data/puromodels#has_topic",
          "label": "has_topic",
          "fromType": "1",
          "toType": "1",
          "fromRelation": []
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/puromodels#Book",
          "label": "Book",
          "ontoType": "Kind",
          "puroType": "BType",
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#has_topic",
            "http://lod2-dev.vse.cz/data/puromodels#published_in"
          ],
          "direction": "from",
          "type": "Class"
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/puromodels#Topic",
          "label": "Topic",
          "ontoType": "Mode",
          "puroType": "BType",
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#has_topic"
          ],
          "direction": "to",
          "type": "Class"
        },
        {
          "type": "relation",
          "ontoType": "Generalization",
          "from": "http://lod2-dev.vse.cz/data/puromodels#Topic",
          "to": "http://lod2-dev.vse.cz/data/puromodels#DDC_Topic",
          "uri": "http://lod2-dev.vse.cz/data/ontomodels/relation/Generalization/http://lod2-dev.vse.cz/data/puromodels#Topichttp://lod2-dev.vse.cz/data/puromodels#DDC_Topic",
          "label": "nazev",
          "fromType": "",
          "toType": "",
          "fromRelation": []
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/puromodels#DDC_Topic",
          "label": "DDC_Topic",
          "ontoType": "Subkind",
          "puroType": "BType",
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#has_topic"
          ],
          "direction": "to",
          "type": "Class"
        },
        {
          "type": "relation",
          "ontoType": "Relator",
          "from": "http://lod2-dev.vse.cz/data/ontomodels#sds",
          "to": "http://lod2-dev.vse.cz/data/puromodels#Location",
          "uri": "http://lod2-dev.vse.cz/data/puromodels#published_in",
          "label": "published_in",
          "fromType": [
            "1",
            "1"
          ],
          "toType": [
            "1",
            "1"
          ],
          "fromRelation": []
        },
        {
          "type": "relation",
          "ontoType": "Generalization",
          "from": "http://lod2-dev.vse.cz/data/puromodels#Book",
          "to": "http://lod2-dev.vse.cz/data/ontomodels#sds",
          "uri": "http://lod2-dev.vse.cz/data/ontomodels/relation/Generalization/http://lod2-dev.vse.cz/data/puromodels#Bookhttp://lod2-dev.vse.cz/data/ontomodels#sds",
          "label": "nazev",
          "fromType": "",
          "toType": "",
          "fromRelation": []
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/ontomodels#sds",
          "label": "sds",
          "ontoType": "Role",
          "puroType": false,
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#published_in"
          ],
          "direction": "from",
          "type": "Class"
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/ontomodels#asddf",
          "label": "asddf",
          "ontoType": "Datatype",
          "puroType": "BValue",
          "fromRelation": [
            {
              "token": "uri",
              "value": "http://lod2-dev.vse.cz/data/puromodels#published_in"
            }
          ],
          "direction": "from",
          "type": "Class"
        },
        {
          "type": "relation",
          "ontoType": "connect",
          "from": "http://lod2-dev.vse.cz/data/puromodels#published_in",
          "to": "http://lod2-dev.vse.cz/data/ontomodels#asddf",
          "uri": "http://lod2-dev.vse.cz/data/ontomodels/relation/connect/http://lod2-dev.vse.cz/data/puromodels#published_inhttp://lod2-dev.vse.cz/data/ontomodels#asddf",
          "label": "nazev",
          "fromType": "*",
          "toType": "*",
          "fromRelation": []
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/puromodels#Location",
          "label": "Location",
          "ontoType": "Role",
          "puroType": "BType",
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#published_in"
          ],
          "direction": "to",
          "type": "Class"
        },
        {
          "type": "relation",
          "ontoType": "Generalization",
          "from": "http://lod2-dev.vse.cz/data/ontomodels#dfaw",
          "to": "http://lod2-dev.vse.cz/data/puromodels#Location",
          "uri": "http://lod2-dev.vse.cz/data/ontomodels/relation/Generalization/http://lod2-dev.vse.cz/data/ontomodels#dfawhttp://lod2-dev.vse.cz/data/puromodels#Location",
          "label": "nazev",
          "fromType": "",
          "toType": "",
          "fromRelation": []
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/ontomodels#dfaw",
          "label": "dfaw",
          "ontoType": "Kind",
          "puroType": false,
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#published_in"
          ],
          "direction": "to",
          "type": "Class"
        }
      ]`); 
    }
}
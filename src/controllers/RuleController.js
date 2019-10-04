import jsonData from './rules.json';

import $ from 'jquery';

export default class RuleController {


    constructor() {

       
        var puro ;
        
        $.ajax({
            type: "GET",
            url: "http://localhost:3000/puroOutput.xml",
            async: false,
            dataType: "xml",
            success: function(xml) {
                this.puroXML = xml;
                puro = xml; 
            }
        });
        this.puroXML = puro;
        this.rulesJson = JSON.parse(JSON.stringify(jsonData));
  
      
    }
    



    
    firstFind = () => {
        //console.log(this.xmlText);
        var puroXML = this.puroXML;
        var rulesJson = this.rulesJson;
        $(puroXML).find("puro\\:BRelation").each(function () {
           
            $(this).find("puro\\:linkedTo").each(function () {
                var resource = ($(this).attr("rdf:resource"));
                //console.log($(puroXML).find('[rdf\\:about="'+resource+'"]')[0]);
                console.log($(puroXML));
                var linkedElement = $(puroXML).find('[rdf\\:about="' + resource + '"]');

                if (linkedElement[0].tagName == "puro:BObject") // do BTYPE!!!!!!!!!!!!!!
                {
                    var BTypeName = linkedElement.find("puro\\:instanceOf").attr("rdf:resource");
                    // parse or find -> doesnt matter -> cut to get name 
                    for (let i in rulesJson.rules) {
                        //vrat skutecny nazev
                        if (rulesJson.rules[i].fromPuro == "BObject" && rulesJson.rules[i].fromOnto == "") {
                            return ["What type is Author??",Array.from(this.rulesJson.classes), BTypeName]; 
                        }
                    }

                    // this.setState(buttons: [])

                }
                else if (linkedElement[0].tagName == "puro:BType") {

                }
                else if (linkedElement[0].tagName == "puro:Attribute") {

                }

            });
        });
    }
}


package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import java.io.StringWriter;

import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.vocabulary.RDFS;


public class RDFAnimals {

	private Model model;
	
	public void writeModel(String lang) {
		System.out.println(" ==== " + lang + " ================================");
		model.write(System.out, lang);
		System.out.println();
	}
	
	public String getModeltoString(String lang) {
		StringWriter stringWriter = new StringWriter();
		model.write(stringWriter, lang);
		return stringWriter.toString();
	}
	
	public void addStatement(String s, String p, String o) {
		Resource subject = model.createResource(s);
		Property predicate = model.createProperty(p);
		RDFNode object = model.createResource(o);
		Statement stmt = model.createStatement(subject, predicate, object);
		model.add(stmt);
	}
	
	public void createModel() {
		model = ModelFactory.createDefaultModel();
		String ns = "http://www.example.org#";
		String nsRDFS = "http://www.w3.org/2000/01/rdf-schema#";
		
		addStatement(ns+"Fish", nsRDFS+"subClassOf", ns+"Animal");
		addStatement(ns+"Fish", ns+"livesIn", ns+"Water");
		
		addStatement(ns+"Mammal", nsRDFS+"subClassOf", ns+"Animal");
		addStatement(ns+"Mammal", ns+"has", ns+"Vertebra");
		
		addStatement(ns+"Whale", nsRDFS+"subClassOf", ns+"Mammal");
		addStatement(ns+"Whale", ns+"livesIn", ns+"Water");
		
		addStatement(ns+"Cat", nsRDFS+"subClassOf", ns+"Mammal");
		addStatement(ns+"Cat", ns+"has", ns+"Fur");
		
		addStatement(ns+"Bear", nsRDFS+"subClassOf", ns+"Mammal");
		addStatement(ns+"Bear", ns+"has", ns+"Fur");
		
		Resource bear = model.getResource(ns+"Bear");
		bear.addProperty(RDFS.label, "Bjørn", "no");
		bear.addProperty(RDFS.label, "Bear", "en");
		
	}
		
	public void writeResource(String test, String lang) {
		String ns = "http://www.example.org#";
		Resource r = model.getResource(ns+test);
		StmtIterator iter = model.listStatements(r, (Property)null, (RDFNode)null);
		Model newModel = iter.toModel();
		System.out.println(" ==== " + lang + " ================================");
		newModel.write(System.out, lang);
		System.out.println();
	}
	
	public static void main(String[] args){
		RDFAnimals dave = new RDFAnimals();
		dave.createModel();
		
		dave.writeModel("RDF/XML");
	    dave.writeModel("RDF/XML-ABBREV");
	    dave.writeModel("N-TRIPLE");
	    dave.writeModel("TURTLE");
	    dave.writeModel("N3");
	    
	    // jena 4.5 버전
	    dave.writeModel("JSON-LD");
	    dave.writeModel("RDF/JSON");
	    
	    
	    dave.writeResource("Bear", "RDF/XML");
	    dave.writeResource("Bear", "TURTLE");
	    
	    // 이건 JSON-LD 에서 모델로 읽어오기 인듯.. 반대는???
	    // https://jena.apache.org/documentation/io/json-ld-11.html
//	    RDFParser parser = RDFParser.fromString(dave.getModeltoString("TURTLE"))
//	             .forceLang(Lang.JSONLD11)
//	             .build();
	    

	    // https://stackoverflow.com/questions/16939159/iterate-over-specific-resource-in-rdf-file-with-jena		 
	    
	    
	}
	
}

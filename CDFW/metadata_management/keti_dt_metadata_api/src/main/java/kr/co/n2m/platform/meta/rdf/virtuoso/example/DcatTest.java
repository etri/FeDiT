package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import java.io.StringWriter;

import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.vocabulary.DCAT;
import org.apache.jena.vocabulary.DCTerms;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.apache.jena.vocabulary.XSD;

public class DcatTest {

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
	
	public Resource addStatement(String s, String p, String o) {
		Resource subject = model.createResource(s);
		Property predicate = model.createProperty(p);
		RDFNode object = model.createResource(o);
		Statement stmt = model.createStatement(subject, predicate, object);
		model.add(stmt);
		return subject;
	}
	
	public Resource addStatement(String s, String p, Resource o) {
		Resource subject = model.createResource(s);
		Property predicate = model.createProperty(p);
//		RDFNode object = model.createResource(o);
		Statement stmt = model.createStatement(subject, predicate, o);
		model.add(stmt);
		return subject;
	}
	
	public Resource addStatement(String s, Property p, String o) {
		Resource subject = model.createResource(s);
//		Property predicate = model.createProperty(p);
		RDFNode object = model.createResource(o);
		Statement stmt = model.createStatement(subject, p, object);
		model.add(stmt);
		return subject;
	}
	
	public Resource addStatement(Resource s, Property p, Resource o) {
		Statement stmt = model.createStatement(s, p, o);
		model.add(stmt);
		return s;
	}		
	
	public Resource addStatement(Resource s, String p, String o) {
//		Resource subject = model.createResource(s);
		Property predicate = model.createProperty(p);
		RDFNode object = model.createResource(o);
		Statement stmt = model.createStatement(s, predicate, object);
		model.add(stmt);
		return s;
	}
	
	public Resource addStatementLiteral(Resource s, Property p, String o) {
//		Resource subject = model.createResource(s);
//		Property predicate = model.createProperty(p);
		RDFNode object = model.createLiteral(o);
		Statement stmt = model.createStatement(s, p, object);
		model.add(stmt);
		return s;
	}
	
	public Resource addStatement(Resource s, String p, Resource o) {
//		Resource subject = model.createResource(s);
		Property predicate = model.createProperty(p);
//		RDFNode object = model.createResource(o);
		Statement stmt = model.createStatement(s, predicate, o);
		model.add(stmt);
		return s;
	}
	
	public void createModel() {
	    model = ModelFactory.createDefaultModel();

	    // setting namespaces
	    model.setNsPrefix("dcat", DCAT.getURI());
	    model.setNsPrefix("rdf", RDF.getURI());
	    model.setNsPrefix("rdfs", RDFS.getURI());
	    model.setNsPrefix("xsd", XSD.getURI());
	    model.setNsPrefix("dcterms", DCTerms.getURI());
	    
		String myNs = "http://localhost:6997/meta/api/v1/resource/data/";
		String medataSetId = "mOAJ8-mRfIgk-5rv~S-v1SmrO";
		
		
		
		Resource s1 = model.createResource();
		Resource o1 = model.createResource(DCAT.getURI() + "Catalog");
		addStatement(s1, RDF.type, o1);
		
		Resource o2 = model.createResource(DCAT.getURI() + "Dataset");
//		Resource s2 = model.createResource(myNs+medataSetId);
		Resource s2 = model.createResource();
		addStatement(s2, RDF.type, o2);
		addStatement(s1, DCAT.getURI() + "dataset", s2);
		
		addStatementLiteral(s2, model.createProperty(DCTerms.getURI() + "type"), "AbcDt");
		addStatementLiteral(s2, model.createProperty(DCTerms.getURI() + "title"), "나야나 디티");
		addStatementLiteral(s2, model.createProperty(DCTerms.getURI() + "title"), "");

		
//		s2.addLiteral(model.createProperty(DCTerms.getURI() + "type"), "AbcDt");
//
//		s2.addLiteral(model.createProperty(DCTerms.getURI() + "title"), "나야나 디티");
//
//		s2.addLiteral(model.createProperty(DCTerms.getURI() + "title"), "");
//		
//		s2.addProperty(model.createProperty(DCTerms.getURI() + "title"), "", "ko");
		
		
//		s2.addLiteral(model.createProperty(DCTerms.getURI() + "title"), null);
	
		// 사용하는 네임스페이스 조회
		
		
		
		
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
		DcatTest dave = new DcatTest();
		dave.createModel();
		
//		dave.writeModel("DCAT");
		
		dave.writeModel("RDF/XML");
	    dave.writeModel("RDF/XML-ABBREV");
	    dave.writeModel("N-TRIPLE");
	    dave.writeModel("TURTLE");
	    dave.writeModel("N3");
//	    
//	    // jena 4.5 버전
//	    dave.writeModel("JSON-LD");
//	    dave.writeModel("RDF/JSON");
	    
	    
//	    dave.writeResource("Bear", "RDF/XML");
//	    dave.writeResource("Bear", "TURTLE");
	    
	    // 이건 JSON-LD 에서 모델로 읽어오기 인듯.. 반대는???
	    // https://jena.apache.org/documentation/io/json-ld-11.html
//	    RDFParser parser = RDFParser.fromString(dave.getModeltoString("TURTLE"))
//	             .forceLang(Lang.JSONLD11)
//	             .build();
	    

	    // https://stackoverflow.com/questions/16939159/iterate-over-specific-resource-in-rdf-file-with-jena		 
	    
	    
	}
}

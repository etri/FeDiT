package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import java.util.Iterator;

import org.apache.jena.graph.Graph;
import org.apache.jena.graph.Node;
import org.apache.jena.graph.Triple;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.RDFNode;

import virtuoso.jena.driver.VirtGraph;
import virtuoso.jena.driver.VirtuosoQueryExecution;
import virtuoso.jena.driver.VirtuosoQueryExecutionFactory;
import virtuoso.jena.driver.VirtuosoUpdateFactory;
import virtuoso.jena.driver.VirtuosoUpdateRequest;

public class VirtuosoSPARQLExample9 {
	
	/**
	 * Example 9 demonstrates the use of the CONSTRUCT, DESCRIBE, and ASK SPARQL query forms, with the following command:
	 * 
	 * DESCRIBE (설명),  CONSTRUCT (구성을 바꿔서 모델을 가져옴..RDF 그래프를 반환. 실제는 안바뀜??) ,  ASK (존재여부? true/fals)
	 * 
	 * SELECT   는 사용자가 찾고자 하는 데이터를 찾는 용도로 사용합니다. 마치 데이터베이스에서 SELECT문으로 질의를 하는 것과 같습니다.
	 * DESCRIBE 는 사용자가 찾고자 하는 정보에 대해서 그 정보와 연결된 모든 트리플을 반환받고자 할 때 사용합니다.
	 * ASK      는 사용자가 찾고자 하는 쿼리의 결과가 있는지 없는지를 boolean(true 또는 false) 값으로 알려줍니다.
	 * CONSTRUCT는 사용자가 찾고자 하는 쿼리를 하면서 동시에 자신이 원하는 템플릿을 입력해줌으로 쿼리의 결과가 사용자가 원하는 템플릿대로 나오도록 할 때 사용합니다. 
	 *             이는 single RDF Graph라고 하는데 쉽게 말하면 내가 원하는 트리플 모양대로 결과를 반환해 달라는 것입니다.
	 * 
	 * 쿼리 SELECT양식은 변수 바인딩을 반환합니다. 쿼리 CONSTRUCT형식은 RDF 그래프를 반환합니다.
	 */
	public static void main(String[] args) {

		String url;
		if(args.length == 0)
		    url = "jdbc:virtuoso://localhost:1111";
		else
		    url = args[0];

		/*			STEP 1			*/
		VirtGraph set = new VirtGraph (url, "dba", "dba");

		/*			STEP 2			*/
        String str = "CLEAR GRAPH <http://test1>";
        VirtuosoUpdateRequest vur = VirtuosoUpdateFactory.create(str, set);
        vur.exec();                  

        str = "INSERT INTO GRAPH <http://test1> { <http://aa> <http://bb> 'cc' . <http://aa1> <http://bb> 123. }";
        vur = VirtuosoUpdateFactory.create(str, set);
        vur.exec();                  


        /*		Select all data in virtuoso	*/
		Query sparql = QueryFactory.create("SELECT * FROM <http://test1> WHERE { ?s ?p ?o }");
		VirtuosoQueryExecution vqe = VirtuosoQueryExecutionFactory.create (sparql, set);
		ResultSet results = vqe.execSelect();
        System.out.println("\nSELECT results:");
		while (results.hasNext()) {
			QuerySolution rs = results.nextSolution();
		    RDFNode s = rs.get("s");
		    RDFNode p = rs.get("p");
		    RDFNode o = rs.get("o");
		    System.out.println(" { " + s + " " + p + " " + o + " . }");
		}

		sparql = QueryFactory.create("DESCRIBE <http://aa> FROM <http://test1>");
		vqe = VirtuosoQueryExecutionFactory.create (sparql, set);

		Model model = vqe.execDescribe();
        Graph g = model.getGraph();
        System.out.println("\nDESCRIBE results:");
        for (Iterator i = g.find(Node.ANY, Node.ANY, Node.ANY); i.hasNext();) {
              Triple t = (Triple)i.next();
              System.out.println(" { " + t.getSubject() + " " + 
	      				 t.getPredicate() + " " + 
	      				 t.getObject() + " . }");
        }

        // 쿼리해서 실행하면 설명 HTML 이 나옴
        /*
Default Graph IRI	
Query	
DESCRIBE <http://aa> FROM <http://test1>
   
SPARQL | HTML Microdata document
This HTML5 document contains 1 embedded RDF statements represented using HTML+Microdata notation.

The embedded RDF content will be recognized by any processor of HTML5 Microdata.

Namespace Prefixes
Prefix	IRI
n2	http://
rdf	http://www.w3.org/1999/02/22-rdf-syntax-ns#
xsdh	http://www.w3.org/2001/XMLSchema#
Statements
Subject Item
n2:aa
n2:bb
cc
         */


		sparql = QueryFactory.create("CONSTRUCT { ?x <http://test> ?y } FROM <http://test1> WHERE { ?x <http://bb> ?y }");
		vqe = VirtuosoQueryExecutionFactory.create (sparql, set);

		model = vqe.execConstruct();
 	    g = model.getGraph();
        System.out.println("\nCONSTRUCT results:");
        for (Iterator i = g.find(Node.ANY, Node.ANY, Node.ANY); i.hasNext();) {
	    	Triple t = (Triple)i.next();
	    	System.out.println(" { " + t.getSubject() + " " + 
	      				 t.getPredicate() + " " + 
	      				 t.getObject() + " . }");
	    }


		sparql = QueryFactory.create("ASK FROM <http://test1> WHERE { <http://aa> <http://bb> ?y }");
		vqe = VirtuosoQueryExecutionFactory.create (sparql, set);

		boolean res = vqe.execAsk();
                System.out.println("\nASK results: "+res);


	}

}

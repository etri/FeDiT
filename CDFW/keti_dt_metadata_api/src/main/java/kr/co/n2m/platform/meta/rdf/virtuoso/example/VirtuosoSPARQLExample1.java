package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import org.apache.jena.query.Query;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.RDFNode;

import virtuoso.jena.driver.VirtGraph;
import virtuoso.jena.driver.VirtuosoQueryExecution;
import virtuoso.jena.driver.VirtuosoQueryExecutionFactory;

public class VirtuosoSPARQLExample1 {

	/**
	 * Example 1 returns the contents of the RDF Quad store of the targeted Virtuoso instance, with the following command:
	 * 
	 * GRAPH 모든 그래프 가져와서 내용 조회하기
	 * 
	 * 특정 GRAPH 에서 내용 조회하기
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


/*			STEP 3			*/
/*		Select all data in virtuoso	*/
		Query sparql = QueryFactory.create("SELECT * WHERE { GRAPH ?graph { ?s ?p ?o } } limit 100");
		/*			STEP 4			*/
		VirtuosoQueryExecution vqe = VirtuosoQueryExecutionFactory.create (sparql, set);
		ResultSet results = vqe.execSelect();
		while (results.hasNext()) {
			QuerySolution result = results.nextSolution();
		    RDFNode graph = result.get("graph");
		    RDFNode s = result.get("s");
		    RDFNode p = result.get("p");
		    RDFNode o = result.get("o");
		    System.out.println(graph + " { " + s + " " + p + " " + o + " . }");
		}				
		
		
		
		// GRAPH IRI : "http://localhost:8890/DAV/BA0029_T" 에서 조회
		
		VirtGraph set2 = new VirtGraph ("http://localhost:8890/DAV/BA0029_T", url, "dba", "dba");
		
		Query sparql2 = QueryFactory.create("SELECT * WHERE { ?s ?p ?o }");

		VirtuosoQueryExecution vqe2 = VirtuosoQueryExecutionFactory.create (sparql2, set2);

		ResultSet results2 = vqe2.execSelect();
		while (results2.hasNext()) {
			QuerySolution result = results2.nextSolution();
		    RDFNode graph = result.get("graph");
		    RDFNode s = result.get("s");
		    RDFNode p = result.get("p");
		    RDFNode o = result.get("o");
		    System.out.println(graph + " { " + s + " " + p + " " + o + " . }");
		}
	}
}

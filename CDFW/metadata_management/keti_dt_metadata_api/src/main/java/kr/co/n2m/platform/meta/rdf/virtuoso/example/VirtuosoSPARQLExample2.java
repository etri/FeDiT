package kr.co.n2m.platform.meta.rdf.virtuoso.example;



import org.apache.jena.query.Query;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.RDFNode;

import virtuoso.jena.driver.VirtGraph;
import virtuoso.jena.driver.VirtuosoQueryExecution;
import virtuoso.jena.driver.VirtuosoQueryExecutionFactory;

public class VirtuosoSPARQLExample2 {

	/**
	 * Example 2 reads in the contents of the following FOAF URIs --
	 * http://kidehen.idehen.net/dataspace/person/kidehen#this
	 * http://www.w3.org/People/Berners-Lee/card#i
	 * http://demo.openlinksw.com/dataspace/person/demo#this
	 * -- and returns the RDF data stored, with the following command:
	 * 
	 * ---- https://www.w3.org/People/Berners-Lee/card#i 이것만 됨.  다른  URL ???? 을 읽어서 그래프를 만드는 거 같은데 제대로 안되었음!!!!
	 */
	public static void main(String[] args) {

		String url;
		if(args.length == 0)
		    url = "jdbc:virtuoso://localhost:1111";
		else
		    url = args[0];

/*			STEP 1			*/
		VirtGraph graph = new VirtGraph ("Example2", url, "dba", "dba");

/*			STEP 2			*/
/*		Load data to Virtuoso		*/
		graph.clear ();

		System.out.print ("Begin read from 'http://www.w3.org/People/Berners-Lee/card#i'  ");
		//graph.read("http://www.w3.org/People/Berners-Lee/card#i", "RDF/XML");
		graph.read("https://www.w3.org/People/Berners-Lee/card#i", "RDF/XML");
		System.out.println ("\t\t\t Done.");

		//System.out.print ("Begin read from 'http://demo.openlinksw.com/dataspace/person/demo#this'  ");
		// graph.read("http://demo.openlinksw.com/dataspace/person/demo#this", "RDF/XML");
		//ERROR graph.read("https://demo.openlinksw.com/dataspace/person/demo#this", "RDF/XML");
		//System.out.println ("\t Done.");

		//System.out.print ("Begin read from 'http://kidehen.idehen.net/dataspace/person/kidehen#this'  ");
		//graph.read("http://kidehen.idehen.net/dataspace/person/kidehen#this", "RDF/XML");
		//ERROR graph.read("https://kidehen.idehen.net/dataspace/person/kidehen#this", "RDF/XML");
		//System.out.println ("\t Done.");


/*			STEP 3			*/
/*		Select only from VirtGraph	*/
		Query sparql = QueryFactory.create("SELECT ?s ?p ?o WHERE { ?s ?p ?o }");

/*			STEP 4			*/
		VirtuosoQueryExecution vqe = VirtuosoQueryExecutionFactory.create (sparql, graph);

		ResultSet results = vqe.execSelect();
		while (results.hasNext()) {
			QuerySolution result = results.nextSolution();
		    RDFNode graph_name = result.get("graph");
		    RDFNode s = result.get("s");
		    RDFNode p = result.get("p");
		    RDFNode o = result.get("o");
		    System.out.println(graph_name + " { " + s + " " + p + " " + o + " . }");
		}

		System.out.println("graph.getCount() = " + graph.getCount());
	}
}
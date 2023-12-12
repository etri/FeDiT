package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Literal;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.DC;

import virtuoso.jena.driver.VirtModel;

public class VirtuosoSPARQLExample12 {

	/**
	 * Example 12 demonstrates the execution of a SPARQL query against a virtuoso url and prints results, with the following command:
	 * 
	 * DatabaseModel      createResource     ARQ - SPARQL Algebra
	 * // 참고: 쿼리는 ARQ에 의해 구문 분석 및 실행되므로 느리게 작동합니다.
     * // Virtuoso SPARQL 기능을 사용할 수 없습니다.
	 */
	public static void main(String[] args) {
	    String url;
	    if(args.length == 0)
	        url = "jdbc:virtuoso://localhost:1111";
	    else
	        url = args[0];
	
        Model m = VirtModel.openDatabaseModel("my:test", url, "dba", "dba");
        m.removeAll();

        Resource r1 = m.createResource("http://example.org/book#1") ;
        Resource r2 = m.createResource("http://example.org/book#2") ;
        
        r1.addProperty(DC.title, "SPARQL - the book")
          .addProperty(DC.description, "A book about SPARQL") ;
        
        r2.addProperty(DC.title, "Advanced techniques for SPARQL") ;

        String prolog = "PREFIX dc: <"+DC.getURI()+"> \n" ;
        
        // Query string.
        String queryString = prolog + "SELECT ?title WHERE {?x dc:title ?title}" ; 
        System.out.println("Execute query=\n"+queryString) ;
        System.out.println() ;
	
	    Query query = QueryFactory.create(queryString) ;
	
		System.out.println("\n==CASE 1 ==Parse ARQ  Execute ARQ  GraphStore Virtuoso");
		//NOTE: query is parsed & executed by ARQ, so it works slow
		// and you can't use Virtuoso SPARQL features
        QueryExecution qexec = QueryExecutionFactory.create(query, m) ;
        // Or QueryExecutionFactory.create(queryString, model) ;
        System.out.println("Titles: ") ;
        try {
            ResultSet rs = qexec.execSelect() ;
            for ( ; rs.hasNext() ; ) {
                QuerySolution rb = rs.nextSolution() ;
                RDFNode x = rb.get("title") ;
                if ( x.isLiteral() ) {
                    Literal titleStr = (Literal)x  ;
                    System.out.println("    "+titleStr) ;
                } else
                    System.out.println("Strange - not a literal: "+x) ;
            }
        } finally {
            qexec.close() ;
        }
	

    }
	
}

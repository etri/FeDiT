package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import java.util.StringTokenizer;

import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.InfModel;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.vocabulary.RDFS;

import virtuoso.jena.driver.VirtInfGraph;
import virtuoso.jena.driver.VirtModel;
import virtuoso.jena.driver.VirtuosoQueryExecutionFactory;

public class VirtuosoSPARQLExample13 {
	
	/**
	 * Example 13 demonstrates the use of inference rules with the following command:
	 * 
	 * 이해가 안감!!!!!!!!!!!!  추론 규칙이 뭐길래????? 그냥 sparql 과 다른 결과 .... 가  나오는 이유는? 추론 모델 이라서??????
	 * 
	 * 
	 * http://daddynkidsmakers.blogspot.com/2020/01/blog-post.html
	 * 지식 추론 기능
	 * 
	 * 지식은 사용자의 관점에 따라 상대적인 개념이다. 예를 들어, 다음과 같은 사실 데이터가 있다고 하자.
	 * A는 B를 가진다.
	 * B는 C를 가진다.
	 * 사실 데이터는 트리플(triple)인 주어, 목적어, 술어를 가진다. 여기서 지식은 사실 데이터를 이용해 다음과 같이 추론 될 수 있다.
	 * A는 C를 가진다.
	 * 지식은 다양한 방법으로 얻을 수 있다. 사람은 지식을 얻을 때 연역, 귀납, 유추의 방법을 사용한다. 위 지식은 연역을 사용한 것이다. 귀납은 관찰된 사실을 일반화하는 것이다. 유추는 유사성을 바탕으로 대상의 성질을 추측한다. 사람은 계산을 통해, 확률 통계적 지식을 얻을 수 있다.
	 * 지식 추론 기능 = {연역, 귀납, 유추, 확률 통계}
	 * 이 4가지를 지식 추론 기능이라 한다. 이 기능은 컴퓨터 계산기능으로 대치될 수 있다. 위 기능에서 연역, 귀납, 유추는 서로 유사한 면이 있다. 수치를 다루는 확률 통계는 이 글에서 다루지 않는다. 이 부분은 인공지능 머신러닝, 데이터 마이닝의 수치해석적 기능에 속한다.
	 * 
	 */

	public static void main(String[] args) {
		String url;
		if(args.length == 0)
		    url = "jdbc:virtuoso://localhost:1111";
		else
		    url = args[0];

		/*** LOADING data to http://exmpl13 graph  ***/
        
        VirtModel mdata = VirtModel.openDatabaseModel("http://exmpl13", url, "dba", "dba");
        mdata.removeAll();

        Statement st;

        st = statement(mdata, "http://localhost:8890/dataspace http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/ns#Space" );
       	mdata.add(st);

        st = statement(mdata, "http://localhost:8890/dataspace http://rdfs.org/sioc/ns#link http://localhost:8890/ods");
       	mdata.add(st);


        st = statement(mdata, "http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/types#Weblog");
       	mdata.add(st);
        st = statement(mdata, "http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://rdfs.org/sioc/ns#link http://localhost:8890/dataspace/test2/weblog/test2tWeblog");
       	mdata.add(st);

        st = statement(mdata, "http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/types#MessageBoard");
       	mdata.add(st);
        st = statement(mdata, "http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://rdfs.org/sioc/ns#link http://localhost:8890/dataspace/discussion/oWiki-test1Wiki");
       	mdata.add(st);


        // Query string.
        String queryString = "SELECT * WHERE {?s ?p ?o}" ; 
        System.out.println("Execute query=\n"+queryString) ;
        System.out.println() ;


        QueryExecution qexec = VirtuosoQueryExecutionFactory.create(queryString, mdata) ;
        try {
            ResultSet rs = qexec.execSelect() ;
            for ( ; rs.hasNext() ; ) {
            	QuerySolution result = rs.nextSolution();
			    RDFNode s = result.get("s");
			    RDFNode p = result.get("p");
			    RDFNode o = result.get("o");
			    System.out.println(" { " + s + " " + p + " " + o + " . }");
            }
        } finally {
            qexec.close() ;
        }

        mdata.removeRuleSet("exmpl13_rules","http://:exmpl13_schema");    //  <-- 지움......왜????


        /*** LOADING rule to http://exmpl13_schema graph  ***/

        VirtModel mrule = VirtModel.openDatabaseModel("http://exmpl13_schema", url, "dba", "dba");
        mrule.removeAll();

        Resource r1 = mrule.createResource("http://rdfs.org/sioc/ns#Space") ;
        r1.addProperty(RDFS.subClassOf, rdfNode(mrule, "http://www.w3.org/2000/01/rdf-schema#Resource"));

        r1 = mrule.createResource("http://rdfs.org/sioc/ns#Container") ;
        r1.addProperty(RDFS.subClassOf, rdfNode(mrule, "http://rdfs.org/sioc/ns#Space"));

        r1 = mrule.createResource("http://rdfs.org/sioc/ns#Forum") ;
        r1.addProperty(RDFS.subClassOf, rdfNode(mrule, "http://rdfs.org/sioc/ns#Container"));

        r1 = mrule.createResource("http://rdfs.org/sioc/types#Weblog") ;
        r1.addProperty(RDFS.subClassOf, rdfNode(mrule, "http://rdfs.org/sioc/ns#Forum"));

        r1 = mrule.createResource("http://rdfs.org/sioc/types#MessageBoard") ;
        r1.addProperty(RDFS.subClassOf, rdfNode(mrule, "http://rdfs.org/sioc/ns#Forum"));

        r1 = mrule.createResource("http://rdfs.org/sioc/ns#link") ;
        r1.addProperty(RDFS.subPropertyOf, rdfNode(mrule, "http://rdfs.org/sioc/ns"));

        mrule.close();

        mdata.createRuleSet("exmpl13_rules","http://exmpl13_schema");    // <--- 이건 왜 하는 건지???   추론을 위한 것 ??????????????????
        
        
        System.out.println() ;
        System.out.println("----------- 룰 셋 바꾸고 찍기???? ---------") ;
        queryString = "SELECT * WHERE {?s ?p ?o}" ; 
        System.out.println("Execute query=\n"+queryString) ;
        System.out.println() ;
        qexec = VirtuosoQueryExecutionFactory.create(queryString, mdata) ;
        try {
            ResultSet rs = qexec.execSelect() ;
            for ( ; rs.hasNext() ; ) {
            	QuerySolution result = rs.nextSolution();
			    RDFNode s = result.get("s");
			    RDFNode p = result.get("p");
			    RDFNode o = result.get("o");
			    System.out.println(" { " + s + " " + p + " " + o + " . }");
            }
        } finally {
            qexec.close() ;
        }
        System.out.println() ;
        
        
        mdata.close();
        
        
        
        


        VirtInfGraph infGraph = new VirtInfGraph("exmpl13_rules", false,    // <--- 추론 그래프?????
        				"http://exmpl13", url, "dba", "dba");
        InfModel model = ModelFactory.createInfModel(infGraph);      // <----- 추론 모델....
        
        
        System.out.println("---- 추론 모델을 다 찍어보자------") ;
        queryString = "SELECT * WHERE {?s ?p ?o}" ; 
		System.out.println("\n\nExecute query=\n"+queryString) ;
		System.out.println() ;
		
		qexec = VirtuosoQueryExecutionFactory.create(queryString, model) ;
		try {
			ResultSet rs = qexec.execSelect() ;
			for ( ; rs.hasNext() ; ) {
				QuerySolution result = rs.nextSolution();
				RDFNode s = result.get("s");
				RDFNode p = result.get("p");
				RDFNode o = result.get("o");
				System.out.println(" { " + s + " " + p + " " + o + " . }");
			}
		} finally {
			qexec.close() ;
		}
        System.out.println("---- end   ------") ;
        
        
        queryString = "SELECT ?s "+
                      "FROM <http://exmpl13> "+
                      "WHERE {?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>  <http://rdfs.org/sioc/ns#Space> } ";
        System.out.println("\n\nExecute query=\n"+queryString) ;
        System.out.println() ;

        qexec = VirtuosoQueryExecutionFactory.create(queryString, model) ;
        try {
            ResultSet rs = qexec.execSelect() ;
            for ( ; rs.hasNext() ; ) {
		QuerySolution result = rs.nextSolution();
		    RDFNode s = result.get("s");
		    System.out.println(" " + s);
            }
        } finally {
            qexec.close() ;
        }



        queryString = "SELECT * "+
                      "FROM <http://exmpl13> "+
                      "WHERE "+
                      "{ "+
                      " ?s ?p <http://rdfs.org/sioc/ns#Space> . "+
                      " ?s ?p1 <http://localhost:8890/dataspace/test2/weblog/test2tWeblog> . "+
                      "} ";
        
        System.out.println("\n\nExecute query=\n"+queryString) ;
        System.out.println() ;

        qexec = VirtuosoQueryExecutionFactory.create(queryString, model) ;
        try {
            ResultSet rs = qexec.execSelect() ;
            for ( ; rs.hasNext() ; ) {
            	QuerySolution result = rs.nextSolution();
			    RDFNode s = result.get("s");
			    RDFNode p = result.get("p");
			    RDFNode p1 = result.get("p1");
			    //System.out.println(" " + s + " " + p + " " + p1);
			    System.out.println(" " + s + " || p:  " + p + " || p1:  " + p1);
            }
        } finally {
            qexec.close() ;
        }

        model.close();
        
        /*    이해 안감.............................!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
         * 
Execute query=
SELECT * WHERE {?s ?p ?o}

 { http://localhost:8890/dataspace http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/ns#Space . }
 { http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/types#Weblog . }
 { http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/types#MessageBoard . }
 { http://localhost:8890/dataspace http://rdfs.org/sioc/ns#link http://localhost:8890/ods . }
 { http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://rdfs.org/sioc/ns#link http://localhost:8890/dataspace/test2/weblog/test2tWeblog . }
 { http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://rdfs.org/sioc/ns#link http://localhost:8890/dataspace/discussion/oWiki-test1Wiki . }

----------- 룰 셋 바꾸고 찍기???? ---------
Execute query=
SELECT * WHERE {?s ?p ?o}

 { http://localhost:8890/dataspace http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/ns#Space . }
 { http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/types#Weblog . }
 { http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/types#MessageBoard . }
 { http://localhost:8890/dataspace http://rdfs.org/sioc/ns#link http://localhost:8890/ods . }
 { http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://rdfs.org/sioc/ns#link http://localhost:8890/dataspace/test2/weblog/test2tWeblog . }
 { http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://rdfs.org/sioc/ns#link http://localhost:8890/dataspace/discussion/oWiki-test1Wiki . }

---- 추론 모델을 다 찍어보자------


Execute query=
SELECT * WHERE {?s ?p ?o}

 { http://localhost:8890/dataspace http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/ns#Space . }											<-- s
 { http://localhost:8890/dataspace http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://www.w3.org/2000/01/rdf-schema#Resource . }
 { http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/types#Weblog . }
 { http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/ns#Forum . }
 { http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/ns#Container . }
 { http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/ns#Space . }				 	<-- s	<---- p ???????????????????????????
 { http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://www.w3.org/2000/01/rdf-schema#Resource . }
 { http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/types#MessageBoard . }
 { http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/ns#Forum . }
 { http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/ns#Container . }
 { http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://rdfs.org/sioc/ns#Space . }					<-- s
 { http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://www.w3.org/2000/01/rdf-schema#Resource . }
 { http://localhost:8890/dataspace http://rdfs.org/sioc/ns#link http://localhost:8890/ods . }
 { http://localhost:8890/dataspace http://rdfs.org/sioc/ns http://localhost:8890/ods . }
 { http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://rdfs.org/sioc/ns#link http://localhost:8890/dataspace/test2/weblog/test2tWeblog . }     			<---- p1
 { http://localhost:8890/dataspace/test2/weblog/test2tWeblog http://rdfs.org/sioc/ns http://localhost:8890/dataspace/test2/weblog/test2tWeblog . }						<---- p1
 { http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://rdfs.org/sioc/ns#link http://localhost:8890/dataspace/discussion/oWiki-test1Wiki . }
 { http://localhost:8890/dataspace/discussion/oWiki-test1Wiki http://rdfs.org/sioc/ns http://localhost:8890/dataspace/discussion/oWiki-test1Wiki . }
---- end   ------


Execute query=
SELECT ?s FROM <http://exmpl13> WHERE {?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>  <http://rdfs.org/sioc/ns#Space> } 

 http://localhost:8890/dataspace
 http://localhost:8890/dataspace/test2/weblog/test2tWeblog
 http://localhost:8890/dataspace/discussion/oWiki-test1Wiki


Execute query=
SELECT * FROM <http://exmpl13> WHERE {  ?s ?p <http://rdfs.org/sioc/ns#Space> .  ?s ?p1 <http://localhost:8890/dataspace/test2/weblog/test2tWeblog> . } 

 http://localhost:8890/dataspace/test2/weblog/test2tWeblog || p:  http://www.w3.org/1999/02/22-rdf-syntax-ns#type || p1:  http://rdfs.org/sioc/ns
 http://localhost:8890/dataspace/test2/weblog/test2tWeblog || p:  http://www.w3.org/1999/02/22-rdf-syntax-ns#type || p1:  http://rdfs.org/sioc/ns#link
         */
    }



    public static Statement statement( Model m, String fact ) {
    	StringTokenizer st = new StringTokenizer( fact );
		Resource sub = resource( m, st.nextToken() );
		Property pred = property( m, st.nextToken() );
		RDFNode obj = rdfNode( m, st.nextToken() );
		return m.createStatement( sub, pred, obj );    
    }    

    public static Resource resource( Model m, String s ) {
    	//return (Resource) rdfNode( m, s ); 
    	// 없어서 아래와 같이 내 맘대로 바꿔봄.  ???????????!!!!!!!!!!! 
    	return m.createResource(s);
    }

    public static Property property( Model m, String s ) {
        //return (Property) rdfNode( m, s ).as( Property.class ); 
        // 없어서 아래와 같이 내 맘대로 바꿔봄.  ???????????!!!!!!!!!!! ;
    	return m.createProperty(s);
	}
    
    public static RDFNode rdfNode( Model m, String s ) {
        //return m.asRDFNode( NodeCreateUtils.create( m, s ) );
        // 없어서 아래와 같이 내 맘대로 바꿔봄.  ???????????!!!!!!!!!!! 
		//return (RDFNode) ResourceFactory.createResource(s); 
		return (RDFNode)  m.createResource(s);
	}
    
}

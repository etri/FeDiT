package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import org.apache.jena.ontology.OntModel;
import org.apache.jena.ontology.OntModelSpec;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.ResultSet;
import org.apache.jena.query.ResultSetFormatter;
import org.apache.jena.rdf.model.InfModel;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.reasoner.ReasonerRegistry;
import org.apache.jena.util.PrintUtil;
import org.apache.jena.vocabulary.RDFS;

import virtuoso.jena.driver.VirtModel;

public class VirtuosoSPARQLExample14 {

	/**
	 * Example 14 demonstrates the use of the Jena in memory Inference and Ontology Model rules with the following command:
	 * 
	 * DB ,  Inferenced Model,   Ontology Model
	 * listStatements : 패턴과 일치하는 모든 명령문을 찾습니다.
	 */
	static String URL = "jdbc:virtuoso://localhost:1111";
    static final String uid = "dba";
    static final String pwd = "dba";


    public static void print_model(String header, Model m) {
        String h = header==null?"Model":header;
        System.out.println("===========["+h+"]==========");
        StmtIterator it = m.listStatements((Resource)null, (Property)null, (RDFNode)null);
        while(it.hasNext()) {
            Statement st = it.nextStatement();
            System.out.println(st);
        }
        System.out.println("============================\n");
    }

    public static void print_model(String header, StmtIterator it) {
        String h = header==null?"Model iterator":header;
        System.out.println("===========["+h+"]==========");
        while(it.hasNext()) {
            Statement st = it.nextStatement();
            System.out.println(st);
        }
        System.out.println("============================\n");
    }

    public static void exec_select(String header, Model m, String query) {
        String h = header==null?"":header;
        System.out.println("===========["+h+"]==========");
        System.out.println("Exec: "+ query);
        Query jquery = QueryFactory.create(query) ;
        QueryExecution qexec = QueryExecutionFactory.create(jquery, m) ;
        ResultSet results =  qexec.execSelect();
        ResultSetFormatter.out(System.out, results, jquery);
        qexec.close();
        System.out.println("============================\n");

    }

    public static void main(String[] args) {
        if (args.length != 0)
            URL = args[0];

        try {
            test1();
            test2();
            test3();
            test4();
        } catch (Exception e) {
            System.out.println("ERROR Test Failed.");
            e.printStackTrace();
        }

    }



    public static void test1() {
        try {
            System.out.println("--------------- TEST 1 -------------------");
            VirtModel vdata = VirtModel.openDatabaseModel("test:inf1", URL, uid, pwd);
            vdata.removeAll();

            String NS = PrintUtil.egNS;
            Resource c1 = vdata.createResource(NS + "C1");
            Resource c2 = vdata.createResource(NS + "C2");
            Resource c3 = vdata.createResource(NS + "C3");
            vdata.add(c2, RDFS.subClassOf, c3);
            InfModel im = ModelFactory.createInfModel(ReasonerRegistry.getRDFSReasoner(), vdata); // <------ Inferenced Model
            print_model("Data in DB", vdata);
            print_model("Data in Inferenced Model", im);

            Model premise = ModelFactory.createDefaultModel();  // <-------- 메모리 베이스드 모델??????  a memory-based Graph 의 기본 모델
            premise.add(c1, RDFS.subClassOf, c2);
            print_model("Test listStatements",im.listStatements(c1, RDFS.subClassOf, null, premise));

        } catch (Exception e) {
            System.out.println("ERROR Test Failed.");
            e.printStackTrace();
        }
    }


    public static void test2() {
        try {
            System.out.println("--------------- TEST 2 -------------------");
            VirtModel vdata = VirtModel.openDatabaseModel("test:inf2", URL, uid, pwd);
            vdata.removeAll();

            String NS = PrintUtil.egNS;
            Resource c1 = vdata.createResource(NS + "C1");
            Resource c2 = vdata.createResource(NS + "C2");
            Resource c3 = vdata.createResource(NS + "C3");
            vdata.add(c2, RDFS.subClassOf, c3);
            OntModel om = ModelFactory.createOntologyModel(OntModelSpec.RDFS_MEM_RDFS_INF, vdata); // <------ Ontology Model

            print_model("Data in DB", vdata);
            print_model("Data in Ontology Model", om);

            Model premise = ModelFactory.createDefaultModel();
            premise.add(c1, RDFS.subClassOf, c2);
            print_model("Test listStatements",om.listStatements(c1, RDFS.subClassOf, null, premise)); // <--- listStatements : 패턴과 일치하는 모든 명령문을 찾습니다.

        } catch (Exception e) {
            System.out.println("ERROR Test Failed.");
            e.printStackTrace();
        }
    }


    public static void test3() {
        try {
            System.out.println("--------------- TEST 3 -------------------");
            VirtModel vdata = VirtModel.openDatabaseModel("test:inf3", URL, uid, pwd);
            vdata.removeAll();

            String NS = PrintUtil.egNS;
            Resource c1 = vdata.createResource(NS + "C1");
            Resource c2 = vdata.createResource(NS + "C2");
            Resource c3 = vdata.createResource(NS + "C3");
            vdata.add(c2, RDFS.subClassOf, c3);
            vdata.add(c1, RDFS.subClassOf, c2);
            InfModel im = ModelFactory.createInfModel(ReasonerRegistry.getRDFSReasoner(), vdata);

            exec_select("Data in DB", vdata, "select * where {?s ?p ?o}");

            exec_select("Data in Inferenced Model", im, "select * where {?s ?p ?o}");

            exec_select("Data in Inferenced Model", im, "select * where {<"+c1+"> <"+RDFS.subClassOf+"> ?o}");

        } catch (Exception e) {
            System.out.println("ERROR Test Failed.");
            e.printStackTrace();
        }
    }


    public static void test4() {
        try {
            System.out.println("--------------- TEST 4 -------------------");
            VirtModel vdata = VirtModel.openDatabaseModel("test:inf4", URL, uid, pwd);
            vdata.removeAll();

            String NS = PrintUtil.egNS;
            Resource c1 = vdata.createResource(NS + "C1");
            Resource c2 = vdata.createResource(NS + "C2");
            Resource c3 = vdata.createResource(NS + "C3");
            vdata.add(c2, RDFS.subClassOf, c3);
            vdata.add(c1, RDFS.subClassOf, c2);
            OntModel om = ModelFactory.createOntologyModel(OntModelSpec.RDFS_MEM_RDFS_INF, vdata);

            exec_select("Data in DB", vdata, "select * where {?s ?p ?o}");

            exec_select("Data in Ontology Model", om, "select * where {?s ?p ?o}");

            exec_select("Data in Ontology", om, "select * where {<"+c1+"> <"+RDFS.subClassOf+"> ?o}");

        } catch (Exception e) {
            System.out.println("ERROR Test Failed.");
            e.printStackTrace();
        }
    }
}

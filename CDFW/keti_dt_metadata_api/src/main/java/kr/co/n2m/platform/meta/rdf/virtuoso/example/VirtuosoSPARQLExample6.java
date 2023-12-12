package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import org.apache.jena.graph.Node;
import org.apache.jena.graph.NodeFactory;
import org.apache.jena.graph.Triple;
import org.apache.jena.util.iterator.ExtendedIterator;

import virtuoso.jena.driver.VirtGraph;

public class VirtuosoSPARQLExample6 {

	/**
	 * Example 6 demonstrates the use of the graph.getTransactionHandler method, with the following command:
	 * 
	 * 트랜잭션!!!!!   graph.getTransactionHandler().begin();   graph.getTransactionHandler().commit();  graph.getTransactionHandler().abort();
	 */
	public static void main(String[] args) {
		String url;
		if(args.length == 0)
		    url = "jdbc:virtuoso://localhost:1111";
		else
		    url = args[0];
	
		Node foo1 = NodeFactory.createURI("http://example.org/#foo1");
		Node bar1 = NodeFactory.createURI("http://example.org/#bar1");
		Node baz1 = NodeFactory.createURI("http://example.org/#baz1");
	
		Node foo2 = NodeFactory.createURI("http://example.org/#foo2");
		Node bar2 = NodeFactory.createURI("http://example.org/#bar2");
		Node baz2 = NodeFactory.createURI("http://example.org/#baz2");
	
		Node foo3 = NodeFactory.createURI("http://example.org/#foo3");
		Node bar3 = NodeFactory.createURI("http://example.org/#bar3");
		Node baz3 = NodeFactory.createURI("http://example.org/#baz3");
	
		VirtGraph graph = new VirtGraph ("Example6", url, "dba", "dba");
	
		graph.clear ();
	
		System.out.println("graph.isEmpty() = " + graph.isEmpty());
	
		System.out.println("test Transaction Commit.");
		graph.getTransactionHandler().begin();
		System.out.println("begin Transaction.");
		System.out.println("Add 3 triples to graph <Example6>.");
	
		graph.add(new Triple(foo1, bar1, baz1));
		graph.add(new Triple(foo2, bar2, baz2));
		graph.add(new Triple(foo3, bar3, baz3));
	
		graph.getTransactionHandler().commit();
		System.out.println("commit Transaction.");
		System.out.println("graph.isEmpty() = " + graph.isEmpty());
		System.out.println("graph.getCount() = " + graph.getCount());
	
		ExtendedIterator<Triple> iter = graph.find(Node.ANY, Node.ANY, Node.ANY);
		System.out.println ("\ngraph.find(Node.ANY, Node.ANY, Node.ANY) \nResult:");
		for ( ; iter.hasNext() ; )
		    System.out.println ((Triple) iter.next());
	
		graph.clear ();
		System.out.println("\nCLEAR graph <Example6>");
		System.out.println("graph.isEmpty() = " + graph.isEmpty());
	
		System.out.println("Add 1 triples to graph <Example6>.");
		graph.add(new Triple(foo1, bar1, baz1));
	
		System.out.println("test Transaction Abort.");
		graph.getTransactionHandler().begin();
		System.out.println("begin Transaction.");
		System.out.println("Add 2 triples to graph <Example6>.");
	
		graph.add(new Triple(foo2, bar2, baz2));
		graph.add(new Triple(foo3, bar3, baz3));
	
		graph.getTransactionHandler().abort();
		System.out.println("abort Transaction.");
		System.out.println("graph.isEmpty() = " + graph.isEmpty());
		System.out.println("graph.getCount() = " + graph.getCount());
	
		iter = graph.find(Node.ANY, Node.ANY, Node.ANY);
		System.out.println ("\ngraph.find(Node.ANY, Node.ANY, Node.ANY) \nResult:");
		for ( ; iter.hasNext() ; )
		    System.out.println ((Triple) iter.next());
	
		graph.clear ();
		System.out.println("\nCLEAR graph <Example6>");

    }
}

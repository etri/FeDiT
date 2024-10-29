package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import org.apache.jena.graph.Node;
import org.apache.jena.graph.NodeFactory;
import org.apache.jena.graph.Triple;
import org.apache.jena.util.iterator.ExtendedIterator;

import virtuoso.jena.driver.VirtGraph;

public class VirtuosoSPARQLExample5
{

	/**
	 * Example 5 demonstrates the use of the graph.find method for searching triples, with the following command:
	 * 
	 * graph.find    any Node 찾기   특정노드 ?p(ANY)  ?o(ANY) 느낌...
	 * @param args
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
	
		VirtGraph graph = new VirtGraph ("Example5", url, "dba", "dba");
	
		graph.clear ();
	
		System.out.println("graph.isEmpty() = " + graph.isEmpty());
	
		System.out.println("Add 5 triples to graph <Example5>.");
	
		graph.add(new Triple(foo1, bar1, baz1));
		graph.add(new Triple(foo2, bar2, baz2));
		graph.add(new Triple(foo3, bar3, baz3));
		graph.add(new Triple(foo1, bar2, baz2));
		graph.add(new Triple(foo1, bar3, baz3));
	
		System.out.println("graph.isEmpty() = " + graph.isEmpty());
		System.out.println("graph.getCount() = " + graph.getCount());
	
		ExtendedIterator<Triple> iter = graph.find(foo1, Node.ANY, Node.ANY);
		System.out.println ("\ngraph.find(foo1, Node.ANY, Node.ANY) \nResult:");
		for ( ; iter.hasNext() ; )
		    System.out.println ((Triple) iter.next());
	
		iter = graph.find(Node.ANY, Node.ANY, baz3);
		System.out.println ("\ngraph.find(Node.ANY, Node.ANY, baz3) \nResult:");
		for ( ; iter.hasNext() ; )
		    System.out.println ((Triple) iter.next());
	
		iter = graph.find(foo1, Node.ANY, baz3);
		System.out.println ("\ngraph.find(foo1, Node.ANY, baz3) \nResult:");
		for ( ; iter.hasNext() ; )
		    System.out.println ((Triple) iter.next());
		
		// 모두 Node.ANY 로 해보기 
		iter = graph.find(Node.ANY, Node.ANY, Node.ANY);
		System.out.println ("\ngraph.find(Node.ANY, Node.ANY, Node.ANY) \nResult:");
		for ( ; iter.hasNext() ; )
		    System.out.println ((Triple) iter.next());
	
		graph.clear ();

    }
}

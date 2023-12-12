package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import java.util.ArrayList;
import java.util.List;

import org.apache.jena.graph.GraphUtil;
import org.apache.jena.graph.Node;
import org.apache.jena.graph.NodeFactory;
import org.apache.jena.graph.Triple;
import org.apache.jena.util.iterator.ExtendedIterator;

import virtuoso.jena.driver.VirtGraph;

public class VirtuosoSPARQLExample7 {

	/**
	 * Example 7 demonstrates the use of the graph.getBulkUpdateHandler method, with the following command:
	 * 
	 *  graph.getBulkUpdateHandler()   이걸 쓰는 건데... 메소드가 없어짐!!! -> 이 예제는 불가!!
	 *  ---->>>> GraphUtil.add  , GraphUtil.delete ?????
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
	
		List triples1 = new ArrayList();
		triples1.add(new Triple(foo1, bar1, baz1));
		triples1.add(new Triple(foo2, bar2, baz2));
		triples1.add(new Triple(foo3, bar3, baz3));
	
		List triples2 = new ArrayList();
		triples2.add(new Triple(foo1, bar1, baz1));
		triples2.add(new Triple(foo2, bar2, baz2));
	
		VirtGraph graph = new VirtGraph ("Example7", url, "dba", "dba");
	
		graph.clear ();
	
		System.out.println("graph.isEmpty() = " + graph.isEmpty());
		System.out.println("Add List with 3 triples to graph <Example7> via BulkUpdateHandler.  ---->>>> GraphUtil.add   ?????");
	
//		graph.getBulkUpdateHandler().add(triples1);
		// TODO 위와 비슷한 기능을 GraphUtil으로 구현, 추후 수정 혹은 삭제 필요
		GraphUtil.add(graph, triples1);
		
	
		System.out.println("graph.isEmpty() = " + graph.isEmpty());
		System.out.println("graph.getCount() = " + graph.getCount());
	
		ExtendedIterator iter = graph.find(Node.ANY, Node.ANY, Node.ANY);
		System.out.println ("\ngraph.find(Node.ANY, Node.ANY, Node.ANY) \nResult:");
		for ( ; iter.hasNext() ; )
		    System.out.println ((Triple) iter.next());
	
	
		System.out.println("\n\nDelete List of 2 triples from graph <Example7> via BulkUpdateHandler.  ---->>>> GraphUtil.delete   ?????");
	
		//graph.getBulkUpdateHandler().delete(triples2);
		// TODO 위와 비슷한 기능을 GraphUtil으로 구현, 추후 수정 혹은 삭제 필요
		GraphUtil.delete(graph, triples2);
	
		System.out.println("graph.isEmpty() = " + graph.isEmpty());
		System.out.println("graph.getCount() = " + graph.getCount());
	
		iter = graph.find(Node.ANY, Node.ANY, Node.ANY);
		System.out.println ("\ngraph.find(Node.ANY, Node.ANY, Node.ANY) \nResult:");
		for ( ; iter.hasNext() ; )
		    System.out.println ((Triple) iter.next());
	
		graph.clear ();
		System.out.println("\nCLEAR graph <Example7>");
    }
}

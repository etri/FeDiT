package kr.co.n2m.platform;

import javax.persistence.EntityManager;

import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.codegroup.entity.QCode;
import kr.co.n2m.platform.admin.feature.codegroup.entity.QCodegroup;

@RunWith(SpringRunner.class)
@SpringBootTest
public class ApplicationTests {

	@Autowired
    EntityManager em;
	
	/*
	 * @Autowired BoardCommentRepository boardCommentRepository;
	 */
	
	// @Test
	public void aa() {
		JPAQueryFactory query = new JPAQueryFactory(em);
		QCodegroup codegroup = QCodegroup.codegroup;
		QCode code = QCode.code;
				
		try {
			String id = query.select(
					code.cdId.substring(4, 9).max().coalesce("0"))
					.from(code).fetchOne();

			System.out.println("ID => " + id);

			
			String uid = String.format("COD_%05d", Integer.parseInt(id) + 1);
			
			System.out.println("UID => " + uid);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	/*
	 * @Test
	 * 
	 * @Rollback(true) public void tesT() { BoardComment data =
	 * BoardComment.builder().bmsOid(1519108641162L) .content("JPA Test")
	 * .creatorID("djko") .created(LocalDateTime.now()).build();
	 * 
	 * BoardComment result = boardCommentRepository.save(data);
	 * 
	 * String pk = String.valueOf(result.getCmtOid());
	 * 
	 * System.out.println("UID => " + pk); }
	 */

}

package kr.co.n2m.platform.admin.feature.board.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.board.entity.Board;

@Repository
public interface BoardRepository extends JpaRepository<Board, String>{

}

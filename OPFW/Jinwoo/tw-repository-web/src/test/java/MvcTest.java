import net.jw.twin.repository.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
@ActiveProfiles(value = "dev")
@ContextConfiguration(locations = {"classpath*:config/spring/context-common.xml"})
public class MvcTest {

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    public void test() {
        System.out.println("test");
    }
}

package kr.co.e8ight.auth.service;

import com.google.common.collect.Lists;
import kr.co.e8ight.auth.dto.AuthorityResposeDto;
import kr.co.e8ight.auth.dto.MemberResponseDto;
import kr.co.e8ight.auth.entity.AuthHistory;
import kr.co.e8ight.auth.entity.Member;
import kr.co.e8ight.auth.exception.AuthorizationException;
import kr.co.e8ight.auth.repository.AuthHistoryRepository;
import kr.co.e8ight.auth.repository.AuthHistoryRepositoryQdsl;
import kr.co.e8ight.auth.repository.MemberRepository;
import kr.co.e8ight.auth.type.ApproveLevel;
import kr.co.e8ight.auth.type.AuthType;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
public class AuthorizationService {

    private MemberService memberService;

    private MemberRepository memberRepository;
    private AuthHistoryRepository authHistoryRepository;

    private AuthHistoryRepositoryQdsl authHistoryRepositoryQdsl;

    private ModelMapper modelMapper = new ModelMapper();

    public AuthorizationService(MemberService memberService,
                                MemberRepository memberRepository,
                                AuthHistoryRepository authHistoryRepository,
                                AuthHistoryRepositoryQdsl authHistoryRepositoryQdsl) {
        this.memberService = memberService;
        this.memberRepository = memberRepository;
        this.authHistoryRepository = authHistoryRepository;
        this.authHistoryRepositoryQdsl = authHistoryRepositoryQdsl;
    }

    public Boolean reqLevelUp(Integer id, String memberId){
        if (id == null)
            id = memberService.findId(memberId);

        AuthHistory authHistory = this.getPossibleLevelUp(id);

        AuthHistory newAuthHistory = AuthHistory.builder()
                        .authType(authHistory.getAuthType())
                        .approveLevel(ApproveLevel.APPLY)
                        .member(authHistory.getMember())
                        .build();

        this.saveAuthHistory(newAuthHistory);

        return Boolean.TRUE;
    }

    public AuthHistory getPossibleLevelUp(Integer id){
        Optional<AuthHistory> optAuthHistory = authHistoryRepositoryQdsl.findLatestById(id);
        if (optAuthHistory.isEmpty())
            throw new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "AuthHistory is not found. memId="+id);

        AuthHistory authHistory = optAuthHistory.get();
        if (authHistory.getApproveLevel().equals(ApproveLevel.APPROVE))
            throw new AuthorizationException(ErrorCode.ALREADY_EXISTS, "Member is already admin. memId="+id);
        else if (authHistory.getApproveLevel().equals(ApproveLevel.APPLY))
            throw new AuthorizationException(ErrorCode.ALREADY_EXISTS, "Member has already applied. memId="+id);

        return authHistory;
    }

    public Page<AuthHistory> applyMemberList(Pageable pageable){

        Page<AuthHistory> authHistoryPage = authHistoryRepositoryQdsl.findAllByApplyStatus(pageable);
        return authHistoryPage;
    }

    public List<AuthorityResposeDto> getMemHistory(Integer id, String memberId){
        if (id == null)
            id = memberService.findId(memberId);

        log.info("id= {}", id);
        List<AuthHistory> authHistories = authHistoryRepositoryQdsl.findAllById(id)
                .orElseThrow(()-> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Member history is not found."));

        List<AuthorityResposeDto> authorityResposeDtos = Lists.newArrayList();
        authHistories.forEach(p-> {
            AuthorityResposeDto resposeDto = new AuthorityResposeDto();
            resposeDto.setId(p.getId());
            resposeDto.setMemberId(p.getMember().getMemberId());
            resposeDto.setApproveLevel(p.getApproveLevel());
            resposeDto.setAuthType(p.getAuthType());
            resposeDto.setRjReason(p.getRjReason());
            resposeDto.setUpdateAt(p.getUpdateAt());

            authorityResposeDtos.add(resposeDto);
        });

        return authorityResposeDtos;
    }

    @Transactional
    public MemberResponseDto approveToAdmin(Integer id, String memberId){
        if (id == null)
            id = memberService.findId(memberId);

        Optional<AuthHistory> optAuthHistory = authHistoryRepositoryQdsl.findLatestById(id);
        if (optAuthHistory.isEmpty())
            throw new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "AuthHistory is not found. memId="+id);

        AuthHistory authHistory = optAuthHistory.get();
        if (!authHistory.getApproveLevel().equals(ApproveLevel.APPLY))
            throw new AuthorizationException(ErrorCode.INVALID_REQUEST, "Member did not apply for level up. id="+id);

        AuthHistory newAuthHistory = AuthHistory.builder()
                        .authType(AuthType.ADMIN)
                        .approveLevel(ApproveLevel.APPROVE)
                        .member(authHistory.getMember())
                        .build();

        authHistoryRepository.save(newAuthHistory);

        Member member = memberService.getMember(id, memberId);
        member.setAuthType(AuthType.ADMIN);

        memberRepository.save(member);

        return modelMapper.map(member, MemberResponseDto.class);
    }

    public List<MemberResponseDto> approveListToAdmin(List<Integer> ids, List<String> memberIds){

        List<MemberResponseDto> memberResponseDtos = Lists.newArrayList();

        Stream<Integer> idStream = ids == null ? Stream.empty() : ids.stream();
        Stream<String> memberIdStream = memberIds == null ? Stream.empty() : memberIds.stream();

        Stream.concat(idStream, memberIdStream.map(memberService::findId))
                .forEach(id -> {

                    try {
                        MemberResponseDto memberResponseDto = approveToAdmin((Integer) id, null);
                        memberResponseDto.setApproveLevel(ApproveLevel.APPROVE);
                        memberResponseDtos.add(memberResponseDto);
                    } catch(AuthorizationException e) {
                        String memberId = memberService.findMemberId((Integer) id);
                        MemberResponseDto memberResponseDto = new MemberResponseDto((Integer) id, memberId);
                        memberResponseDto.setApproveLevel(ApproveLevel.REJECT);
                        memberResponseDtos.add(memberResponseDto);
                    }
                });
        return memberResponseDtos;
    }

    @Transactional(readOnly = true)
    protected AuthHistory getAuthHistory(Integer id){
       AuthHistory authHistory = authHistoryRepository.findById(id)
                .orElseThrow(()-> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "member is not found. id= "+id ));

       return authHistory;
    }

    @Transactional
    public void saveAuthHistory(AuthHistory authHistory){
        authHistoryRepository.save(authHistory);
    }
}

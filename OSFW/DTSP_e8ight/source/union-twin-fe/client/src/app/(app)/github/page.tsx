import { GitHubLinkCard } from '@/app/(app)/github/_components/GitHubLinkCard';
import {
  GITHUB_LINKS,
  MAIN_FRAMEWORK_LINK,
} from '@/app/(app)/github/_constants/githubLinks';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="GitHub 링크" />
      <div className="mx-auto mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GitHubLinkCard
          label="연합 디지털트윈 프레임워크 v1.0"
          link={MAIN_FRAMEWORK_LINK.link}
          description={MAIN_FRAMEWORK_LINK.description}
        />
      </div>
      <div className="mx-auto grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Object.entries(GITHUB_LINKS).map(
          ([label, { name, link, description }]) => (
            <GitHubLinkCard
              key={name}
              label={label}
              link={link}
              description={description}
            />
          ),
        )}
      </div>
    </PageContainer>
  );
}

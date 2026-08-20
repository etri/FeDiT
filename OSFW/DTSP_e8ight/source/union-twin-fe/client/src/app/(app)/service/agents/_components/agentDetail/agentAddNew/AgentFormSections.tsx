import AgentInfoTable from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentInfoTable';
import AgentModelInfoTable from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentModelInfoTable';
import AgentRightTable from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentRightTable';

export function AgentFormSections() {
  return (
    <>
      <section className="border-border space-y-3 rounded-lg border p-4">
        <h3 className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
          Details
        </h3>
        <AgentInfoTable />
      </section>

      <section className="border-border space-y-3 rounded-lg border p-4">
        <h3 className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
          Connection
        </h3>
        <AgentRightTable />
      </section>

      <section className="border-border space-y-3 rounded-lg border p-4">
        <h3 className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
          Models
        </h3>
        <AgentModelInfoTable />
      </section>
    </>
  );
}

import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Boxes, CalendarDays, CornerDownLeft, Search, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/services';
import { useDebounce } from '@/hooks/use-debounce';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/common/loader';
import { EmptyState } from '@/components/common/empty-state';
import { ROUTES, eventDetailsPath } from '@/routes/paths';
import { formatDate } from '@/utils/format';

interface SearchResult {
  id: string;
  group: 'Events' | 'Users' | 'Stations';
  title: string;
  subtitle: string;
  to: string;
  icon: typeof CalendarDays;
}

const GROUP_ORDER: SearchResult['group'][] = ['Events', 'Users', 'Stations'];

export function GlobalSearch() {
  const navigate = useNavigate();
  const dialog = useDisclosure();
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term, 250);

  useKeyboardShortcut({ key: 'k', meta: true, ignoreInputs: false }, (event) => {
    event.preventDefault();
    dialog.open();
  });

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', debounced],
    enabled: dialog.isOpen && debounced.trim().length > 1,
    queryFn: async (): Promise<SearchResult[]> => {
      const listQuery = { search: debounced, page: 1, pageSize: 5 };
      const [events, users, stations] = await Promise.all([
        api.events.list(listQuery),
        api.users.list(listQuery),
        api.catalogues.list(listQuery),
      ]);

      return [
        ...events.items.map<SearchResult>((event) => ({
          id: event.id,
          group: 'Events',
          title: event.eventName,
          subtitle: `${event.clientName || 'No client'} · ${
            event.date ? formatDate(event.date) : 'No date'
          }`,
          to: eventDetailsPath(event.id),
          icon: CalendarDays,
        })),
        ...users.items.map<SearchResult>((user) => ({
          id: user.id,
          group: 'Users',
          title: user.displayName,
          subtitle: `${user.email} · ${user.role}`,
          to: ROUTES.users,
          icon: Users,
        })),
        ...stations.items.map<SearchResult>((station) => ({
          id: station.id,
          group: 'Stations',
          title: station.name,
          subtitle: `${station.category} · ${station.defaultPackingList.length} items`,
          to: ROUTES.catalogue,
          icon: Boxes,
        })),
      ];
    },
  });

  const grouped = useMemo(() => {
    const results = data ?? [];
    return GROUP_ORDER.map((group) => ({
      group,
      items: results.filter((result) => result.group === group),
    })).filter((section) => section.items.length > 0);
  }, [data]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      dialog.close();
      setTerm('');
      navigate(result.to);
    },
    [dialog, navigate],
  );

  const hasQuery = debounced.trim().length > 1;

  return (
    <>
      <Button
        variant="outline"
        onClick={dialog.open}
        className="h-10 w-10 justify-center px-0 text-muted-foreground md:w-64 md:justify-start md:px-3.5 lg:w-80"
        aria-label="Search"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden flex-1 text-left text-sm font-normal md:inline">
          Search events, users…
        </span>
        <kbd className="hidden select-none rounded-md border border-border bg-muted px-1.5 py-0.5 text-[0.6875rem] font-medium md:inline-block">
          ⌘K
        </kbd>
      </Button>

      <Dialog open={dialog.isOpen} onOpenChange={dialog.setOpen}>
        <DialogContent size="lg" showClose={false} className="top-[12%] translate-y-0 p-0">
          <DialogTitle className="sr-only">Global search</DialogTitle>

          <div className="border-b border-border p-3">
            <Input
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search events, users and stations…"
              aria-label="Search everything"
              leftIcon={<Search />}
              className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="max-h-[26rem] min-h-[14rem] overflow-y-auto p-2">
            {!hasQuery ? (
              <EmptyState
                size="sm"
                icon={Search}
                title="Search the workspace"
                description="Type at least two characters to find events, accounts and stations."
              />
            ) : isFetching ? (
              <Loader className="py-16" label="Searching…" />
            ) : grouped.length === 0 ? (
              <EmptyState
                size="sm"
                icon={Search}
                title={`No matches for “${debounced}”`}
                description="Try a client name, venue or station category instead."
              />
            ) : (
              <div className="space-y-4 py-1">
                {grouped.map((section) => (
                  <section key={section.group}>
                    <p className="px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.group}
                    </p>
                    <ul className="space-y-0.5">
                      {section.items.map((result) => {
                        const Icon = result.icon;
                        return (
                          <li key={`${result.group}-${result.id}`}>
                            <button
                              type="button"
                              onClick={() => handleSelect(result)}
                              className={cn(
                                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                                'hover:bg-accent focus-visible:bg-accent',
                              )}
                            >
                              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                                <Icon className="size-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-foreground">
                                  {result.title}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {result.subtitle}
                                </span>
                              </span>
                              <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

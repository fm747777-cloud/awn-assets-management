import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Layers,
  Moon,
  PanelRightOpen,
  Plus,
  Search,
  ShieldAlert,
  Sun,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme.tsx';
import { useToast } from '../hooks/useToast.tsx';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input, Textarea } from '../components/ui/Input.tsx';
import { Select } from '../components/ui/Select.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { FormSection } from '../components/ui/FormSection.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { TableSkeleton } from '../components/ui/LoadingState.tsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.tsx';
import { Drawer } from '../components/ui/Drawer.tsx';

interface TokenSwatch {
  name: string;
  variable: string;
  lightHex: string;
  darkHex: string;
}

const TOKEN_SWATCHES: TokenSwatch[] = [
  { name: 'Background', variable: '--awn-bg', lightHex: '#F7F7F4', darkHex: '#101817' },
  { name: 'Surface', variable: '--awn-surface', lightHex: '#FFFFFF', darkHex: '#16201F' },
  { name: 'Surface Alt', variable: '--awn-surface-alt', lightHex: '#F2F3F1', darkHex: '#1D2928' },
  { name: 'Primary', variable: '--awn-primary', lightHex: '#145B5F', darkHex: '#4F8F8C' },
  { name: 'Primary Strong', variable: '--awn-primary-strong', lightHex: '#0D4145', darkHex: '#145B5F' },
  { name: 'Primary Soft', variable: '--awn-primary-soft', lightHex: '#E8F1F0', darkHex: '#203B3A' },
  { name: 'Gold', variable: '--awn-gold', lightHex: '#B89A5A', darkHex: '#C8AA6E' },
  { name: 'Gold Soft', variable: '--awn-gold-soft', lightHex: '#F4EEDF', darkHex: '#332D21' },
  { name: 'Text Primary', variable: '--awn-text-primary', lightHex: '#1F2933', darkHex: '#F2F4F3' },
  { name: 'Text Secondary', variable: '--awn-text-secondary', lightHex: '#667085', darkHex: '#B8C1BF' },
  { name: 'Text Muted', variable: '--awn-text-muted', lightHex: '#98A2B3', darkHex: '#879390' },
  { name: 'Border', variable: '--awn-border', lightHex: '#E4E7E5', darkHex: '#2B3836' },
];

export default function FoundationShowcasePage() {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [sampleInput, setSampleInput] = useState('Primary Substation Transformer T-04');
  const [sampleErrorInput, setSampleErrorInput] = useState('INVALID-CODE');
  const [sampleSelect, setSampleSelect] = useState('Devices');
  const [sampleNotes, setSampleNotes] = useState(
    'Annual dielectric fluid test completed and verified by HSE Engineering.'
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="UI Foundation & Pattern Kit"
        arabicSubtitle="نظام التصميم والأنماط التفاعلية · عَوْن"
        description="Interactive catalog of centralized Light/Dark design tokens, buttons, inputs, selects, status badges, cards, form sections, modals, drawers, toasts, empty states, and loading skeletons."
        secondaryActions={
          <div className="inline-flex items-center gap-1.5">
            <Button
              variant={theme === 'light' ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<Sun className="w-3.5 h-3.5" />}
              onClick={() => setTheme('light')}
            >
              Light Mode
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<Moon className="w-3.5 h-3.5" />}
              onClick={() => setTheme('dark')}
            >
              Dark Mode
            </Button>
          </div>
        }
        primaryAction={
          <Button
            variant="primary"
            leftIcon={<Bell className="w-4 h-4" />}
            onClick={() =>
              showToast({
                title: 'Foundation Verified',
                description: `Active theme is ${theme.toUpperCase()} mode. All semantic tokens are synchronized.`,
                variant: 'success',
              })
            }
          >
            Trigger Verification Toast
          </Button>
        }
      />

      <Card
        title="01. Centralized Theme Tokens (Light & Dark Mode)"
        description="Zero hardcoded hex values inside components. Every surface, text, border, and accent dynamically resolves from semantic CSS variables."
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TOKEN_SWATCHES.map((swatch) => (
            <div
              key={swatch.variable}
              className="p-3 rounded-md border border-awn-border bg-awn-surface flex flex-col gap-2"
            >
              <div
                className="h-10 w-full rounded border border-awn-border"
                style={{ backgroundColor: `var(${swatch.variable})` }}
              />
              <div>
                <div className="text-xs font-semibold text-awn-text-primary">
                  {swatch.name}
                </div>
                <div className="text-[11px] font-mono text-awn-text-muted tabular-nums">
                  {theme === 'light' ? swatch.lightHex : swatch.darkHex}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card
          title="02. Reusable Buttons"
          description="Variants, sizes, icon slots, loading states, and keyboard focus rings."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Primary Action
              </Button>
              <Button variant="secondary">Secondary Soft</Button>
              <Button variant="outline">Outline Surface</Button>
              <Button variant="gold">Gold Governance</Button>
              <Button variant="ghost">Ghost Action</Button>
              <Button variant="danger">Destructive</Button>
            </div>

            <div className="pt-3 border-t border-awn-border flex flex-wrap items-center gap-2.5">
              <Button variant="primary" size="sm">
                Small (sm)
              </Button>
              <Button variant="primary" size="md">
                Medium (md)
              </Button>
              <Button variant="primary" size="lg">
                Large (lg)
              </Button>
              <Button variant="outline" loading>
                Processing...
              </Button>
              <Button variant="outline" disabled>
                Disabled State
              </Button>
            </div>
          </div>
        </Card>

        <Card
          title="03. Semantic Status Badges"
          description="Accessible status indicators pairing semantic color tokens with explicit text labels and icons."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge label="Assigned" tone="success" />
              <StatusBadge label="Available" tone="info" />
              <StatusBadge label="Compliance Due" tone="warning" />
              <StatusBadge label="Maintenance Hold" tone="error" />
              <StatusBadge label="Pending Audit" tone="gold" />
              <StatusBadge label="Retired" tone="neutral" />
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="04. Form Section Architecture, Inputs & Selects"
        description="Grouped form sections with contextual descriptions, required indicators, helper text, and inline validation."
      >
        <FormSection
          stepNumber="01"
          title="Asset Identification & Inline Validation Demo"
          description="Demonstrates standard inputs, clearable search inputs, select dropdowns, and accessible error states."
          columns={2}
        >
          <Input
            label="Asset Designation"
            required
            value={sampleInput}
            onChange={(e) => setSampleInput(e.target.value)}
            onClear={() => setSampleInput('')}
            description="Standard text input with clear button and helper text."
          />
          <Select
            label="Master Asset Category"
            required
            value={sampleSelect}
            onChange={(e) => setSampleSelect(e.target.value)}
            options={['Devices', 'Licenses', 'Equipment']}
            description="Accessible native select with custom token styling."
          />
          <Input
            label="Serial Reference (Validation Error State)"
            required
            value={sampleErrorInput}
            onChange={(e) => setSampleErrorInput(e.target.value)}
            error="Serial code must include facility prefix (e.g., RYD-HV-9920)."
          />
          <Input
            label="Search Filter Input"
            placeholder="Filter by asset tag or custodian..."
            leftIcon={<Search className="w-3.5 h-3.5" />}
            description="Includes leading icon affordance for table search bars."
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Technical Specification Notes"
              rows={2}
              value={sampleNotes}
              onChange={(e) => setSampleNotes(e.target.value)}
              description="Multi-line textarea for audit remarks and inspection notes."
            />
          </div>
        </FormSection>
      </Card>

      <Card
        title="05. Contextual Overlays: Drawers, Modals, Confirmations & Toasts"
        description="Interactive triggers to verify focus management, Escape key dismissal, and confirmation feedback."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            leftIcon={<PanelRightOpen className="w-4 h-4" />}
            onClick={() => setIsDrawerOpen(true)}
          >
            Open Slide-Over Drawer
          </Button>
          <Button
            variant="outline"
            leftIcon={<Layers className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Open Standard Modal
          </Button>
          <Button
            variant="dangerOutline"
            leftIcon={<ShieldAlert className="w-4 h-4" />}
            onClick={() => setIsConfirmOpen(true)}
          >
            Open Destructive Confirmation
          </Button>
          <Button
            variant="secondary"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={() =>
              showToast({
                title: 'Compliance Certificate Verified',
                description: 'AST-2026-0102 status verified.',
                variant: 'success',
              })
            }
          >
            Toast: Success
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card
          title="06. Reusable Empty State Pattern"
          description="Displayed when a workspace or filtered query returns zero records."
          noPadding
        >
          <EmptyState
            title="No Compliance Exceptions Found"
            description="All registered assets in this facility currently meet their statutory inspection requirements."
          />
        </Card>

        <Card
          title="07. Reusable Skeleton Loading Pattern"
          description="Preserves layout geometry while asynchronous service calls resolve."
          noPadding
        >
          <TableSkeleton rows={5} columns={4} />
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Governance Policy Summary"
        description="Standard modal dialog for focused informational or secondary tasks."
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="text-xs text-awn-text-secondary leading-relaxed">
          Modal dialog verified with semantic tokens.
        </p>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => setIsConfirmOpen(false)}
        title="Confirm Asset Decommissioning"
        description="Decommissioning an asset removes it from active dispatch."
        itemSummary="AST-2026-0102 — Primary Substation Transformer T-04"
        confirmLabel="Confirm"
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Contextual Slide-Over Drawer"
        subtitle="Inspect or edit asset attributes without losing table context."
      >
        <p className="text-xs text-awn-text-secondary leading-relaxed">
          Slide-over drawer verified.
        </p>
      </Drawer>
    </div>
  );
}

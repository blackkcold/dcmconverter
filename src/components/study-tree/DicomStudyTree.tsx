import { useEffect, useMemo, useRef, useState } from 'react';

import type { DicomInstance, DicomSeries, DicomStudy } from '@/dicom/dicomTypes';
import { useDicomStore } from '@/store/useDicomStore';

import {
  buildImportTree,
  getSelectionState,
  pruneSelection,
  toggleSelection
} from './treeSelection';
import type { ImportTreeNode } from './treeSelection';

export function DicomStudyTree() {
  const {
    files,
    studies,
    activeFileId,
    setActiveFileId,
    skippedFiles,
    removeFiles
  } = useDicomStore();
  const [rawSelectedFileIds, setRawSelectedFileIds] = useState<Set<string>>(
    () => new Set()
  );
  const importTree = useMemo(() => buildImportTree(files), [files]);
  const allFileIds = useMemo(() => files.map((file) => file.id), [files]);
  const existingFileIds = useMemo(() => new Set(allFileIds), [allFileIds]);
  const selectedFileIds = useMemo(
    () => pruneSelection(rawSelectedFileIds, existingFileIds),
    [existingFileIds, rawSelectedFileIds]
  );

  function handleToggle(fileIds: readonly string[], checked: boolean) {
    setRawSelectedFileIds((current) => toggleSelection(current, fileIds, checked));
  }

  function handleRemoveSelected() {
    removeFiles(Array.from(selectedFileIds));
    setRawSelectedFileIds(new Set());
  }

  function handleRemoveAll() {
    if (
      window.confirm(
        '移除全部已导入文件？这只会清空当前浏览器会话，不会删除磁盘文件。'
      )
    ) {
      removeFiles(allFileIds);
      setRawSelectedFileIds(new Set());
    }
  }

  if (files.length === 0) {
    return (
      <section className="tool-section grow">
        <h2>Study Tree</h2>
        <p className="empty-state">选择 DICOM 文件后会在这里显示 Study/Series。</p>
      </section>
    );
  }

  return (
    <section className="tool-section grow">
      <h2>Study Tree</h2>
      <div className="tree-actions">
        <button
          type="button"
          onClick={() => setRawSelectedFileIds(new Set(allFileIds))}
        >
          全部选中
        </button>
        <button type="button" onClick={() => setRawSelectedFileIds(new Set())}>
          取消选择
        </button>
        <button
          type="button"
          disabled={selectedFileIds.size === 0}
          onClick={handleRemoveSelected}
        >
          移除选中 ({selectedFileIds.size})
        </button>
        <button type="button" onClick={handleRemoveAll}>
          全部移除
        </button>
      </div>
      <p className="muted tree-note">移除只清理当前导入列表，不会删除磁盘文件。</p>
      <div className="study-tree">
        <details open>
          <summary>
            <span className="tree-summary-row">
              <span>Imported Files</span>
              <span className="count">{files.length}</span>
            </span>
          </summary>
          <ul>
            {importTree.map((node) => (
              <ImportTreeItem
                key={node.path}
                node={node}
                activeFileId={activeFileId}
                selectedFileIds={selectedFileIds}
                onSelectFile={setActiveFileId}
                onToggle={handleToggle}
              />
            ))}
          </ul>
        </details>

        {studies.map((study) => (
          <StudyItem
            key={study.studyInstanceUID}
            study={study}
            activeFileId={activeFileId}
            selectedFileIds={selectedFileIds}
            onSelectFile={setActiveFileId}
            onToggle={handleToggle}
          />
        ))}
      </div>
      {skippedFiles.length > 0 ? (
        <details className="skipped-files">
          <summary>Skipped files ({skippedFiles.length})</summary>
          <ul>
            {skippedFiles.map((file) => (
              <li key={`${file.name}:${file.reason}`}>
                {file.name}: {file.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function ImportTreeItem(props: {
  node: ImportTreeNode;
  activeFileId: string | undefined;
  selectedFileIds: ReadonlySet<string>;
  onSelectFile(fileId: string): void;
  onToggle(fileIds: readonly string[], checked: boolean): void;
}) {
  const { node, activeFileId, selectedFileIds, onSelectFile, onToggle } = props;

  if (node.type === 'file' && node.fileId) {
    return (
      <li className="tree-file-row">
        <TreeCheckbox
          label={`选择文件 ${node.name}`}
          fileIds={node.fileIds}
          selectedFileIds={selectedFileIds}
          onToggle={onToggle}
        />
        <button
          type="button"
          className={activeFileId === node.fileId ? 'tree-active' : ''}
          onClick={() => onSelectFile(node.fileId as string)}
        >
          {node.name}
        </button>
      </li>
    );
  }

  return (
    <li>
      <details open>
        <summary>
          <span className="tree-summary-row">
            <TreeCheckbox
              label={`选择目录 ${node.name}`}
              fileIds={node.fileIds}
              selectedFileIds={selectedFileIds}
              onToggle={onToggle}
            />
            <span>{node.name}</span>
            <span className="count">{node.fileIds.length}</span>
          </span>
        </summary>
        <ul>
          {node.children.map((child) => (
            <ImportTreeItem
              key={child.path}
              node={child}
              activeFileId={activeFileId}
              selectedFileIds={selectedFileIds}
              onSelectFile={onSelectFile}
              onToggle={onToggle}
            />
          ))}
        </ul>
      </details>
    </li>
  );
}

function StudyItem(props: {
  study: DicomStudy;
  activeFileId: string | undefined;
  selectedFileIds: ReadonlySet<string>;
  onSelectFile(fileId: string): void;
  onToggle(fileIds: readonly string[], checked: boolean): void;
}) {
  const { study, activeFileId, selectedFileIds, onSelectFile, onToggle } = props;
  const studyFileIds = study.series.flatMap((series) =>
    series.instances.map((instance) => instance.fileId)
  );

  return (
    <details open>
      <summary>
        <span className="tree-summary-row">
          <TreeCheckbox
            label={`选择 Study ${study.description ?? study.studyInstanceUID}`}
            fileIds={studyFileIds}
            selectedFileIds={selectedFileIds}
            onToggle={onToggle}
          />
          <span>{study.description ?? study.studyInstanceUID}</span>
          <span className="count">{studyFileIds.length}</span>
        </span>
      </summary>
      {study.series.map((series) => (
        <SeriesItem
          key={series.seriesInstanceUID}
          series={series}
          activeFileId={activeFileId}
          selectedFileIds={selectedFileIds}
          onSelectFile={onSelectFile}
          onToggle={onToggle}
        />
      ))}
    </details>
  );
}

function SeriesItem(props: {
  series: DicomSeries;
  activeFileId: string | undefined;
  selectedFileIds: ReadonlySet<string>;
  onSelectFile(fileId: string): void;
  onToggle(fileIds: readonly string[], checked: boolean): void;
}) {
  const { series, activeFileId, selectedFileIds, onSelectFile, onToggle } = props;
  const seriesFileIds = series.instances.map((instance) => instance.fileId);

  return (
    <details open>
      <summary>
        <span className="tree-summary-row">
          <TreeCheckbox
            label={`选择 Series ${series.seriesNumber ?? series.seriesInstanceUID}`}
            fileIds={seriesFileIds}
            selectedFileIds={selectedFileIds}
            onToggle={onToggle}
          />
          <span>
            {series.modality ?? 'Series'} {series.seriesNumber ?? ''}
          </span>
          <span className="count">{series.instances.length}</span>
        </span>
      </summary>
      <ul>
        {series.instances.map((instance) => (
          <InstanceItem
            key={instance.fileId}
            instance={instance}
            activeFileId={activeFileId}
            selectedFileIds={selectedFileIds}
            onSelectFile={onSelectFile}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </details>
  );
}

function InstanceItem(props: {
  instance: DicomInstance;
  activeFileId: string | undefined;
  selectedFileIds: ReadonlySet<string>;
  onSelectFile(fileId: string): void;
  onToggle(fileIds: readonly string[], checked: boolean): void;
}) {
  const { instance, activeFileId, selectedFileIds, onSelectFile, onToggle } = props;

  return (
    <li className="tree-file-row">
      <TreeCheckbox
        label={`选择 Instance ${instance.instanceNumber ?? instance.fileId}`}
        fileIds={[instance.fileId]}
        selectedFileIds={selectedFileIds}
        onToggle={onToggle}
      />
      <button
        type="button"
        className={activeFileId === instance.fileId ? 'tree-active' : ''}
        onClick={() => onSelectFile(instance.fileId)}
      >
        Instance {instance.instanceNumber ?? instance.fileId}
      </button>
    </li>
  );
}

function TreeCheckbox(props: {
  label: string;
  fileIds: readonly string[];
  selectedFileIds: ReadonlySet<string>;
  onToggle(fileIds: readonly string[], checked: boolean): void;
}) {
  const { label, fileIds, selectedFileIds, onToggle } = props;
  const checkboxRef = useRef<HTMLInputElement>(null);
  const selectionState = getSelectionState(fileIds, selectedFileIds);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = selectionState.indeterminate;
    }
  }, [selectionState.indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      aria-label={label}
      checked={selectionState.checked}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onToggle(fileIds, event.currentTarget.checked)}
    />
  );
}

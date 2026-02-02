import fs from 'fs/promises';
import path from 'path';

const STATUS_FILE_PATH = path.join(process.cwd(), 'src/data/podcast-status.json');

const CONVERSION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

async function ensureStatusFile() {
  try {
    await fs.access(STATUS_FILE_PATH);
  } catch {
    await fs.writeFile(STATUS_FILE_PATH, JSON.stringify({}, null, 2));
  }
}

async function readStatusFile() {
  await ensureStatusFile();
  const content = await fs.readFile(STATUS_FILE_PATH, 'utf-8');
  return JSON.parse(content);
}

async function writeStatusFile(data) {
  await fs.writeFile(STATUS_FILE_PATH, JSON.stringify(data, null, 2));
}

export async function createConversionStatus(postId, metadata = {}) {
  const statusData = await readStatusFile();
  
  if (statusData[postId]) {
    console.warn(`[Status Manager] 博客 ${postId} 的转换状态已存在，将被覆盖`);
  }
  
  const conversion = {
    postId,
    status: CONVERSION_STATUS.PENDING,
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stages: {
      contentProcessing: { status: 'pending', startedAt: null, completedAt: null },
      audioGeneration: { status: 'pending', startedAt: null, completedAt: null },
      audioDownload: { status: 'pending', startedAt: null, completedAt: null },
      validation: { status: 'pending', startedAt: null, completedAt: null }
    },
    ...metadata
  };
  
  statusData[postId] = conversion;
  await writeStatusFile(statusData);
  
  console.log(`[Status Manager] 创建转换状态: ${postId}`);
  return conversion;
}

export async function updateConversionStatus(postId, updates) {
  const statusData = await readStatusFile();
  
  if (!statusData[postId]) {
    throw new Error(`博客 ${postId} 的转换状态不存在`);
  }
  
  statusData[postId] = {
    ...statusData[postId],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  if (updates.status === CONVERSION_STATUS.COMPLETED) {
    statusData[postId].completedAt = new Date().toISOString();
  } else if (updates.status === CONVERSION_STATUS.FAILED) {
    statusData[postId].failedAt = new Date().toISOString();
  }
  
  await writeStatusFile(statusData);
  
  return statusData[postId];
}

export async function updateStageStatus(postId, stageName, stageUpdates) {
  const statusData = await readStatusFile();
  
  if (!statusData[postId]) {
    throw new Error(`博客 ${postId} 的转换状态不存在`);
  }
  
  if (!statusData[postId].stages[stageName]) {
    throw new Error(`阶段 ${stageName} 不存在`);
  }
  
  if (!statusData[postId].stages[stageName].startedAt && stageUpdates.status !== 'pending') {
    statusData[postId].stages[stageName].startedAt = new Date().toISOString();
  }
  
  if (stageUpdates.status === 'completed' && !statusData[postId].stages[stageName].completedAt) {
    statusData[postId].stages[stageName].completedAt = new Date().toISOString();
  }
  
  statusData[postId].stages[stageName] = {
    ...statusData[postId].stages[stageName],
    ...stageUpdates
  };
  
  await writeStatusFile(statusData);
  
  return statusData[postId];
}

export async function getConversionStatus(postId) {
  const statusData = await readStatusFile();
  return statusData[postId] || null;
}

export async function getAllConversionStatus() {
  const statusData = await readStatusFile();
  return Object.values(statusData).sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

export async function deleteConversionStatus(postId) {
  const statusData = await readStatusFile();
  
  if (!statusData[postId]) {
    throw new Error(`博客 ${postId} 的转换状态不存在`);
  }
  
  delete statusData[postId];
  await writeStatusFile(statusData);
  
  console.log(`[Status Manager] 删除转换状态: ${postId}`);
  return true;
}

export function calculateProgress(conversion) {
  if (!conversion || !conversion.stages) {
    return 0;
  }
  
  const stages = Object.values(conversion.stages);
  const totalStages = stages.length;
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const inProgressStages = stages.filter(s => s.status === 'in_progress').length;
  
  const progress = ((completedStages + (inProgressStages * 0.5)) / totalStages) * 100;
  return Math.round(progress);
}

export async function updateProgress(postId, progress) {
  return await updateConversionStatus(postId, { progress });
}

export { CONVERSION_STATUS };
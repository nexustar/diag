package command

import (
	"bytes"
	"fmt"
	"math"
	"sync"
	"testing"

	"github.com/onsi/gomega"
)

func Test_ComputeTotalBlock(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	v := computeTotalBlock(60, 20)
	g.Expect(v).To(gomega.Equal(3))

	v = computeTotalBlock(60, 21)
	g.Expect(v).To(gomega.Equal(3))
}

func Test_UploadInitFile(t *testing.T) {
	blockSize := 6

	contents := make([]byte, 0)
	for i := 0; i < 100; i++ {
		contents = append(contents, byte(i))
	}

	resp := &preCreateResponse{
		Partseq:    0,
		BlockBytes: int64(blockSize),
	}

	g := gomega.NewGomegaWithT(t)

	reader := NewMockReader(contents, int(resp.BlockBytes))

	mt := &mapTest{
		results: make(map[int64][]byte),
	}

	err := UploadFile(resp, int64(len(contents)), flushFunc(g, resp, contents, mt), func() (ReaderAtCloseable, error) {
		return reader, nil
	}, uploadFunc(g, mt, reader, len(contents), blockSize))

	g.Expect(err).To(gomega.Succeed())
	g.Expect(reader.closed).To(gomega.Equal(true))
}

func Test_UploadFileMultiBlock(t *testing.T) {
	blockSize := 6

	contents := make([]byte, 0)
	for i := 0; i < 96; i++ {
		contents = append(contents, byte(i))
	}

	g := gomega.NewGomegaWithT(t)
	for i := 0; i < 16; i++ {
		resp := &preCreateResponse{
			Partseq:    i,
			BlockBytes: int64(blockSize),
		}

		reader := NewMockReader(contents, int(resp.BlockBytes))

		mt := &mapTest{
			results: make(map[int64][]byte),
		}

		err := UploadFile(resp, int64(len(contents)), flushFunc(g, resp, contents, mt), func() (ReaderAtCloseable, error) {
			return reader, nil
		}, uploadFunc(g, mt, reader, len(contents), blockSize))

		g.Expect(err).To(gomega.Succeed())
		g.Expect(reader.closed).To(gomega.Equal(true))
	}
}

func Test_UploadFileFromOffset(t *testing.T) {
	blockSize := 6

	contents := make([]byte, 0)
	for i := 0; i < 100; i++ {
		contents = append(contents, byte(i))
	}

	g := gomega.NewGomegaWithT(t)
	for i := 1; i < 17; i++ {
		resp := &preCreateResponse{
			Partseq:    i,
			BlockBytes: int64(blockSize),
		}

		reader := NewMockReader(contents, int(resp.BlockBytes))

		mt := &mapTest{
			results: make(map[int64][]byte),
		}

		err := UploadFile(resp, int64(len(contents)), flushFunc(g, resp, contents, mt), func() (ReaderAtCloseable, error) {
			return reader, nil
		}, uploadFunc(g, mt, reader, len(contents), blockSize))

		g.Expect(err).To(gomega.Succeed())
		g.Expect(reader.closed).To(gomega.Equal(true))
	}
}

var uploadFunc = func(g *gomega.WithT, mt *mapTest, reader *MockReader, fileSize int, defaultBlockSize int) UploadPart {
	return func(i int64, i2 []byte) error {
		g.Expect(reader.closed).To(gomega.Equal(false))
		mt.put(i, i2)

		totalBlock := computeTotalBlock(int64(fileSize), int64(defaultBlockSize))
		if i == int64(totalBlock) {
			if fileSize%defaultBlockSize == 0 {
				g.Expect(len(i2)).To(gomega.Equal(defaultBlockSize))
			} else {
				g.Expect(len(i2)).To(gomega.Equal(fileSize % defaultBlockSize))
			}

		} else {
			g.Expect(len(i2)).To(gomega.Equal(defaultBlockSize))
		}

		return nil
	}
}

var flushFunc = func(g *gomega.WithT, resp *preCreateResponse, contents []byte, mt *mapTest) FlushUploadFile {
	return func() error {
		fmt.Println("\n<>>>>>>>>>")

		totalBlockSize := computeTotalBlock(int64(len(contents)), resp.BlockBytes)

		g.Expect(len(mt.results)).To(gomega.Equal(totalBlockSize - resp.Partseq))

		for i := resp.Partseq; i < totalBlockSize; i++ {
			actualData := mt.results[int64(i+1)]

			offset := i * int(resp.BlockBytes)
			end := math.Min(float64(offset+int(resp.BlockBytes)), float64(len(contents)))

			expectData := contents[offset:int(end)]

			g.Expect(len(actualData)).To(gomega.Equal(len(expectData)))

			for i := 0; i < len(expectData); i++ {
				g.Expect(expectData[i]).To(gomega.Equal(actualData[i]))
			}
		}

		fmt.Println("Complete!")
		return nil
	}
}

type mapTest struct {
	lock    sync.Mutex
	results map[int64][]byte
}

func (m *mapTest) put(serial int64, data []byte) {
	m.lock.Lock()
	defer m.lock.Unlock()

	m.results[serial] = data
}

type MockReader struct {
	reader *bytes.Reader

	blockSize int
	closed    bool
}

func NewMockReader(contents []byte, blockSize int) *MockReader {
	reader := bytes.NewReader(contents)

	return &MockReader{
		reader:    reader,
		blockSize: blockSize,
	}
}

func (m *MockReader) Close() error {
	m.closed = true

	return nil
}

func (m *MockReader) ReadAt(b []byte, off int64) (n int, err error) {
	return m.reader.ReadAt(b, off)
}